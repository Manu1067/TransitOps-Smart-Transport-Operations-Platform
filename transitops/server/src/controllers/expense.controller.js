const supabase = require('../supabaseClient');
const {
  ensureRequiredFields,
  ensureNonNegativeNumber,
} = require('../utils/validators');

const EXPENSE_TYPES = Object.freeze(['Toll', 'Maintenance', 'Other']);

/**
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {unknown} [data=null]
 */
function sendSuccess(res, statusCode, message, data = null) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {unknown} [data=null]
 */
function sendError(res, statusCode, message, data = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
}

/**
 * @param {import('@supabase/supabase-js').PostgrestError | null | undefined} error
 * @returns {string}
 */
function getErrorMessage(error) {
  if (!error) {
    return 'Database operation failed.';
  }

  return error.message || error.details || error.hint || 'Database operation failed.';
}

/**
 * @param {Record<string, unknown>} body
 * @param {{ partial?: boolean }} [options={}]
 * @returns {Record<string, unknown>}
 */
function buildExpensePayload(body, options = {}) {
  const { partial = false } = options;
  const payload = {};

  const setField = (key, value) => {
    if (value !== undefined) {
      payload[key] = value;
    }
  };

  if (!partial || body.trip_id !== undefined) {
    setField('trip_id', body.trip_id ?? null);
  }

  if (!partial || body.vehicle_id !== undefined) {
    setField('vehicle_id', body.vehicle_id ?? null);
  }

  if (!partial || body.driver_id !== undefined) {
    setField('driver_id', body.driver_id ?? null);
  }

  if (!partial || body.expense_type !== undefined) {
    setField('expense_type', body.expense_type);
  }

  if (!partial || body.amount !== undefined || body.cost !== undefined) {
    setField('amount', body.amount ?? body.cost);
  }

  if (!partial || body.description !== undefined) {
    setField('description', body.description ?? null);
  }

  if (!partial || body.incurred_at !== undefined) {
    setField('incurred_at', body.incurred_at ?? null);
  }

  return payload;
}

/**
 * @param {Record<string, unknown>} payload
 */
function ensureAtLeastOneReference(payload) {
  if (!payload.trip_id && !payload.vehicle_id && !payload.driver_id) {
    throw new Error('At least one of trip_id, vehicle_id, or driver_id is required.');
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @returns {string}
 */
function normalizeDateValue(value, fieldName) {
  if (value == null || value === '') {
    return '';
  }

  const dateValue = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return `${dateValue}T00:00:00.000Z`;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO date or YYYY-MM-DD value.`);
  }

  return parsed.toISOString();
}

/**
 * @param {Record<string, unknown>} payload
 * @param {{ partial?: boolean }} [options={}]
 */
function validateExpensePayload(payload, options = {}) {
  const { partial = false } = options;

  if (!partial) {
    ensureRequiredFields(payload, ['expense_type', 'amount']);
    ensureAtLeastOneReference(payload);
  }

  if (payload.expense_type != null && !EXPENSE_TYPES.includes(String(payload.expense_type))) {
    throw new Error(`Invalid expense type. Allowed values: ${EXPENSE_TYPES.join(', ')}.`);
  }

  if (payload.amount != null && payload.amount !== '') {
    payload.amount = ensureNonNegativeNumber(payload.amount, 'Amount');
  } else if (!partial) {
    ensureNonNegativeNumber(payload.amount, 'Amount');
  }

  if (payload.incurred_at != null && payload.incurred_at !== '') {
    payload.incurred_at = normalizeDateValue(payload.incurred_at, 'incurred_at');
  }

  if (partial) {
    const allReferencesProvided = ['trip_id', 'vehicle_id', 'driver_id'].every(
      (field) => field in payload
    );

    if (allReferencesProvided) {
      ensureAtLeastOneReference(payload);
    }
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function listExpenses(req, res) {
  try {
    const { vehicle_id: vehicleId, expense_type: expenseType } = req.query;

    let query = supabase
      .from('expenses')
      .select(`
        *,
        vehicle:vehicles (
          id,
          registration_number,
          make,
          model
        ),
        driver:drivers (
          id,
          full_name
        ),
        trip:trips (
          id,
          source,
          destination,
          status
        )
      `)
      .order('incurred_at', { ascending: false });

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }

    if (expenseType) {
      query = query.eq('expense_type', expenseType);
    }

    const { data, error } = await query;

    if (error) {
      return sendError(res, 500, getErrorMessage(error));
    }

    return sendSuccess(res, 200, 'Expenses fetched successfully.', data || []);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to fetch expenses.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function createExpense(req, res) {
  try {
    const payload = buildExpensePayload(req.body);
    validateExpensePayload(payload);

    const { data, error } = await supabase
      .from('expenses')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23503') {
        return sendError(res, 400, 'Invalid trip, vehicle, or driver reference provided.');
      }

      if (error.code === '23514') {
        return sendError(
          res,
          400,
          'At least one of trip_id, vehicle_id, or driver_id is required.'
        );
      }

      return sendError(res, 500, getErrorMessage(error));
    }

    return sendSuccess(res, 201, 'Expense created successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to create expense.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function updateExpense(req, res) {
  try {
    const { id } = req.params;
    const payload = buildExpensePayload(req.body, { partial: true });

    if (Object.keys(payload).length === 0) {
      return sendError(res, 400, 'No valid fields provided for update.');
    }

    validateExpensePayload(payload, { partial: true });

    const { data, error } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      if (error.code === '23503') {
        return sendError(res, 400, 'Invalid trip, vehicle, or driver reference provided.');
      }

      if (error.code === '23514') {
        return sendError(
          res,
          400,
          'At least one of trip_id, vehicle_id, or driver_id is required.'
        );
      }

      return sendError(res, 500, getErrorMessage(error));
    }

    if (!data) {
      return sendError(res, 404, `Expense not found for id "${id}".`);
    }

    return sendSuccess(res, 200, 'Expense updated successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to update expense.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function deleteExpense(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return sendError(res, 500, getErrorMessage(error));
    }

    if (!data) {
      return sendError(res, 404, `Expense not found for id "${id}".`);
    }

    return sendSuccess(res, 200, 'Expense deleted successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to delete expense.');
  }
}

module.exports = {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
