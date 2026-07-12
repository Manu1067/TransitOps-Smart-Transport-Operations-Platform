const supabase = require('../supabaseClient');
const {
  ensureRequiredFields,
  ensureNonNegativeNumber,
} = require('../utils/validators');

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
 * @param {unknown} value
 * @param {string} fieldName
 * @returns {string}
 */
function normalizeDateFilter(value, fieldName) {
  if (value == null || value === '') {
    return '';
  }

  const dateValue = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO date or YYYY-MM-DD value.`);
  }

  return parsed.toISOString();
}

/**
 * @param {unknown} value
 * @param {boolean} [endOfDay=false]
 * @returns {string}
 */
function toDateBoundary(value, endOfDay = false) {
  const normalized = normalizeDateFilter(value, endOfDay ? 'to_date' : 'from_date');

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return endOfDay
      ? `${normalized}T23:59:59.999Z`
      : `${normalized}T00:00:00.000Z`;
  }

  return normalized;
}

/**
 * @param {Record<string, unknown>} body
 * @param {{ partial?: boolean }} [options={}]
 * @returns {Record<string, unknown>}
 */
function buildFuelLogPayload(body, options = {}) {
  const { partial = false } = options;
  const payload = {};

  const setField = (key, value) => {
    if (value !== undefined) {
      payload[key] = value;
    }
  };

  if (!partial || body.vehicle_id !== undefined) {
    setField('vehicle_id', body.vehicle_id);
  }

  if (!partial || body.trip_id !== undefined) {
    setField('trip_id', body.trip_id ?? null);
  }

  if (!partial || body.liters !== undefined) {
    setField('liters', body.liters);
  }

  if (!partial || body.cost !== undefined) {
    setField('cost', body.cost ?? null);
  }

  if (!partial || body.odometer_reading !== undefined) {
    setField('odometer_reading', body.odometer_reading ?? null);
  }

  if (!partial || body.filled_at !== undefined) {
    setField('filled_at', body.filled_at ?? null);
  }

  if (!partial || body.station_name !== undefined) {
    setField('station_name', body.station_name ?? null);
  }

  if (!partial || body.notes !== undefined) {
    setField('notes', body.notes ?? null);
  }

  return payload;
}

/**
 * @param {Record<string, unknown>} payload
 * @param {{ partial?: boolean }} [options={}]
 */
function validateFuelLogPayload(payload, options = {}) {
  const { partial = false } = options;

  if (!partial) {
    ensureRequiredFields(payload, ['vehicle_id', 'liters']);
  }

  if (payload.liters != null && payload.liters !== '') {
    payload.liters = ensureNonNegativeNumber(payload.liters, 'Liters');
  } else if (!partial) {
    ensureNonNegativeNumber(payload.liters, 'Liters');
  }

  if (payload.cost != null && payload.cost !== '') {
    payload.cost = ensureNonNegativeNumber(payload.cost, 'Cost');
  }

  if (payload.odometer_reading != null && payload.odometer_reading !== '') {
    payload.odometer_reading = ensureNonNegativeNumber(
      payload.odometer_reading,
      'Odometer reading'
    );
  }

  if (payload.filled_at != null && payload.filled_at !== '') {
    payload.filled_at = normalizeDateFilter(payload.filled_at, 'filled_at');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function listFuelLogs(req, res) {
  try {
    const {
      vehicle_id: vehicleId,
      from_date: fromDate,
      to_date: toDate,
    } = req.query;

    let query = supabase
      .from('fuel_logs')
      .select(`
        *,
        vehicle:vehicles (
          id,
          registration_number,
          make,
          model
        )
      `)
      .order('filled_at', { ascending: false });

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }

    if (fromDate) {
      query = query.gte('filled_at', toDateBoundary(fromDate, false));
    }

    if (toDate) {
      query = query.lte('filled_at', toDateBoundary(toDate, true));
    }

    const { data, error } = await query;

    if (error) {
      return sendError(res, 500, getErrorMessage(error));
    }

    return sendSuccess(res, 200, 'Fuel logs fetched successfully.', data || []);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to fetch fuel logs.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function createFuelLog(req, res) {
  try {
    const payload = buildFuelLogPayload(req.body);
    validateFuelLogPayload(payload);

    const { data, error } = await supabase
      .from('fuel_logs')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23503') {
        return sendError(res, 400, 'Invalid vehicle or trip reference provided.');
      }

      return sendError(res, 500, getErrorMessage(error));
    }

    return sendSuccess(res, 201, 'Fuel log created successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to create fuel log.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function updateFuelLog(req, res) {
  try {
    const { id } = req.params;
    const payload = buildFuelLogPayload(req.body, { partial: true });

    if (Object.keys(payload).length === 0) {
      return sendError(res, 400, 'No valid fields provided for update.');
    }

    validateFuelLogPayload(payload, { partial: true });

    const { data, error } = await supabase
      .from('fuel_logs')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      if (error.code === '23503') {
        return sendError(res, 400, 'Invalid vehicle or trip reference provided.');
      }

      return sendError(res, 500, getErrorMessage(error));
    }

    if (!data) {
      return sendError(res, 404, `Fuel log not found for id "${id}".`);
    }

    return sendSuccess(res, 200, 'Fuel log updated successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to update fuel log.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function deleteFuelLog(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('fuel_logs')
      .delete()
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return sendError(res, 500, getErrorMessage(error));
    }

    if (!data) {
      return sendError(res, 404, `Fuel log not found for id "${id}".`);
    }

    return sendSuccess(res, 200, 'Fuel log deleted successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to delete fuel log.');
  }
}

module.exports = {
  listFuelLogs,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
};