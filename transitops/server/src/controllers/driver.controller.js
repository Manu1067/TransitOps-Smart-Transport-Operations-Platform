const supabase = require('../supabaseClient');
const {
  DRIVER_STATUSES,
  ensureRequiredFields,
  ensureNonNegativeNumber,
} = require('../utils/validators');

const VALID_DRIVER_STATUSES = Object.values(DRIVER_STATUSES);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
 * @param {import('@supabase/supabase-js').PostgrestError | null | undefined} error
 * @returns {boolean}
 */
function isUniqueLicenseError(error) {
  return error?.code === '23505'
    && String(error.message || '').toLowerCase().includes('license_number');
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @returns {string}
 */
function validateDateField(value, fieldName) {
  if (value == null || value === '') {
    throw new Error(`${fieldName} is required and must be in YYYY-MM-DD format.`);
  }

  const dateValue = String(value).trim();

  if (!DATE_PATTERN.test(dateValue)) {
    throw new Error(`${fieldName} must be in YYYY-MM-DD format.`);
  }

  const parsed = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid date.`);
  }

  return dateValue;
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {{ required?: boolean }} [options={}]
 * @returns {string | null}
 */
function validateOptionalDateField(value, fieldName, options = {}) {
  if (value == null || value === '') {
    if (options.required) {
      throw new Error(`${fieldName} is required and must be in YYYY-MM-DD format.`);
    }
    return null;
  }

  return validateDateField(value, fieldName);
}

/**
 * @param {Record<string, unknown>} body
 * @param {{ partial?: boolean }} [options={}]
 * @returns {Record<string, unknown>}
 */
function buildDriverPayload(body, options = {}) {
  const { partial = false } = options;
  const payload = {};

  const setField = (key, value) => {
    if (value !== undefined) {
      payload[key] = value;
    }
  };

  if (!partial || body.profile_id !== undefined) {
    setField('profile_id', body.profile_id ?? null);
  }

  if (!partial || body.full_name !== undefined) {
    setField('full_name', body.full_name?.toString().trim());
  }

  if (!partial || body.license_number !== undefined) {
    setField('license_number', body.license_number?.toString().trim());
  }

  if (!partial || body.phone !== undefined) {
    setField('phone', body.phone ?? null);
  }

  if (!partial || body.email !== undefined) {
    setField('email', body.email ?? null);
  }

  if (!partial || body.status !== undefined) {
    setField('status', body.status ?? DRIVER_STATUSES.AVAILABLE);
  }

  if (!partial || body.safety_score !== undefined) {
    setField('safety_score', body.safety_score ?? null);
  }

  if (!partial || body.hire_date !== undefined) {
    setField('hire_date', body.hire_date ?? null);
  }

  if (!partial || body.license_expiry_date !== undefined) {
    setField('license_expiry_date', body.license_expiry_date ?? null);
  }

  return payload;
}

/**
 * @param {Record<string, unknown>} payload
 * @param {{ partial?: boolean }} [options={}]
 */
function validateDriverPayload(payload, options = {}) {
  const { partial = false } = options;

  if (!partial) {
    ensureRequiredFields(payload, ['full_name', 'license_number', 'license_expiry_date']);
  }

  if (payload.status != null && !VALID_DRIVER_STATUSES.includes(String(payload.status))) {
    throw new Error(`Invalid driver status. Allowed values: ${VALID_DRIVER_STATUSES.join(', ')}.`);
  }

  if (payload.safety_score != null && payload.safety_score !== '') {
    const score = ensureNonNegativeNumber(payload.safety_score, 'Safety score');
    if (score > 100) {
      throw new Error('Safety score must be between 0 and 100.');
    }
    payload.safety_score = score;
  }

  if (payload.hire_date != null && payload.hire_date !== '') {
    payload.hire_date = validateOptionalDateField(payload.hire_date, 'Hire date');
  }

  if (payload.license_expiry_date != null && payload.license_expiry_date !== '') {
    payload.license_expiry_date = validateOptionalDateField(
      payload.license_expiry_date,
      'License expiry date',
      { required: !partial }
    );
  } else if (!partial) {
    validateOptionalDateField(payload.license_expiry_date, 'License expiry date', {
      required: true,
    });
  }
}

/**
 * @param {string | null | undefined} licenseNumber
 * @returns {string | null}
 */
function extractLicenseCategory(licenseNumber) {
  if (!licenseNumber) {
    return null;
  }

  const [category] = String(licenseNumber).trim().split('-');
  return category ? category.toUpperCase() : null;
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function listDrivers(req, res) {
  try {
    const { status, licenseCategory } = req.query;

    let query = supabase
      .from('drivers')
      .select('*')
      .order('full_name', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (licenseCategory) {
      query = query.ilike(
        'license_number',
        `${String(licenseCategory).trim().toUpperCase()}-%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return sendError(res, 500, getErrorMessage(error));
    }

    return sendSuccess(res, 200, 'Drivers fetched successfully.', data || []);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to fetch drivers.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getDriverById(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return sendError(res, 500, getErrorMessage(error));
    }

    if (!data) {
      return sendError(res, 404, `Driver not found for id "${id}".`);
    }

    return sendSuccess(res, 200, 'Driver fetched successfully.', {
      ...data,
      license_category: extractLicenseCategory(data.license_number),
    });
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to fetch driver.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function createDriver(req, res) {
  try {
    const payload = buildDriverPayload(req.body);
    validateDriverPayload(payload);

    const { data, error } = await supabase
      .from('drivers')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (isUniqueLicenseError(error)) {
        return sendError(
          res,
          409,
          `A driver with license number "${payload.license_number}" already exists.`
        );
      }

      return sendError(res, 500, getErrorMessage(error));
    }

    return sendSuccess(res, 201, 'Driver created successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to create driver.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function updateDriver(req, res) {
  try {
    const { id } = req.params;
    const payload = buildDriverPayload(req.body, { partial: true });

    if (Object.keys(payload).length === 0) {
      return sendError(res, 400, 'No valid fields provided for update.');
    }

    validateDriverPayload(payload, { partial: true });

    const { data, error } = await supabase
      .from('drivers')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      if (isUniqueLicenseError(error)) {
        return sendError(
          res,
          409,
          `A driver with license number "${payload.license_number}" already exists.`
        );
      }

      return sendError(res, 500, getErrorMessage(error));
    }

    if (!data) {
      return sendError(res, 404, `Driver not found for id "${id}".`);
    }

    return sendSuccess(res, 200, 'Driver updated successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to update driver.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function deleteDriver(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      if (error.code === '23503') {
        return sendError(
          res,
          409,
          'Driver cannot be deleted because they are linked to existing trips or records.'
        );
      }

      return sendError(res, 500, getErrorMessage(error));
    }

    if (!data) {
      return sendError(res, 404, `Driver not found for id "${id}".`);
    }

    return sendSuccess(res, 200, 'Driver deleted successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to delete driver.');
  }
}

module.exports = {
  listDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
};
