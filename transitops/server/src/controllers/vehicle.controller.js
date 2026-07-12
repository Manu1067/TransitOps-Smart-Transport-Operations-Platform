const supabase = require('../supabaseClient');
const {
  VEHICLE_STATUSES,
  ensureRequiredFields,
  ensureNonNegativeNumber,
} = require('../utils/validators');

const VALID_VEHICLE_STATUSES = Object.values(VEHICLE_STATUSES);

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
function isUniqueRegistrationError(error) {
  return error?.code === '23505'
    && String(error.message || '').toLowerCase().includes('registration_number');
}

/**
 * @param {Record<string, unknown>} body
 * @param {{ partial?: boolean }} [options={}]
 * @returns {Record<string, unknown>}
 */
function buildVehiclePayload(body, options = {}) {
  const { partial = false } = options;
  const payload = {};

  const setField = (key, value) => {
    if (value !== undefined) {
      payload[key] = value;
    }
  };

  if (!partial || body.registration_number !== undefined) {
    setField('registration_number', body.registration_number?.toString().trim());
  }

  if (!partial || body.make !== undefined) {
    setField('make', body.make?.toString().trim());
  }

  if (!partial || body.model !== undefined) {
    setField('model', body.model?.toString().trim());
  }

  if (!partial || body.status !== undefined) {
    setField('status', body.status ?? VEHICLE_STATUSES.AVAILABLE);
  }

  if (!partial || body.year !== undefined) {
    setField('year', body.year ?? null);
  }

  if (!partial || body.current_odometer !== undefined) {
    setField('current_odometer', body.current_odometer ?? 0);
  }

  if (!partial || body.acquisition_cost !== undefined) {
    setField('acquisition_cost', body.acquisition_cost ?? null);
  }

  if (!partial || body.vin !== undefined) {
    setField('vin', body.vin ?? null);
  }

  if (!partial || body.fuel_capacity_liters !== undefined) {
    setField('fuel_capacity_liters', body.fuel_capacity_liters ?? null);
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
function validateVehiclePayload(payload, options = {}) {
  const { partial = false } = options;

  if (!partial) {
    ensureRequiredFields(payload, ['registration_number', 'make', 'model']);
  }

  if (payload.status != null && !VALID_VEHICLE_STATUSES.includes(String(payload.status))) {
    throw new Error(`Invalid vehicle status. Allowed values: ${VALID_VEHICLE_STATUSES.join(', ')}.`);
  }

  if (payload.year != null && payload.year !== '') {
    const year = Number(payload.year);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      throw new Error('Year must be an integer between 1900 and 2100.');
    }
    payload.year = year;
  }

  if (payload.current_odometer != null && payload.current_odometer !== '') {
    payload.current_odometer = ensureNonNegativeNumber(
      payload.current_odometer,
      'Current odometer'
    );
  }

  if (payload.acquisition_cost != null && payload.acquisition_cost !== '') {
    payload.acquisition_cost = ensureNonNegativeNumber(
      payload.acquisition_cost,
      'Acquisition cost'
    );
  }

  if (payload.fuel_capacity_liters != null && payload.fuel_capacity_liters !== '') {
    const fuelCapacity = ensureNonNegativeNumber(
      payload.fuel_capacity_liters,
      'Fuel capacity liters'
    );

    if (fuelCapacity <= 0) {
      throw new Error('Fuel capacity liters must be greater than zero.');
    }

    payload.fuel_capacity_liters = fuelCapacity;
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function listVehicles(req, res) {
  try {
    const { type, status, region } = req.query;

    let query = supabase
      .from('vehicles')
      .select('*')
      .order('registration_number', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (region) {
      query = query.ilike('registration_number', `${String(region).trim().toUpperCase()}-%`);
    }

    const { data, error } = await query;

    if (error) {
      return sendError(res, 500, getErrorMessage(error));
    }

    let vehicles = data || [];

    if (type) {
      const search = String(type).trim().toLowerCase();
      vehicles = vehicles.filter((vehicle) => {
        const make = String(vehicle.make || '').toLowerCase();
        const model = String(vehicle.model || '').toLowerCase();
        return make.includes(search) || model.includes(search);
      });
    }

    return sendSuccess(res, 200, 'Vehicles fetched successfully.', vehicles);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to fetch vehicles.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getVehicleById(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return sendError(res, 500, getErrorMessage(error));
    }

    if (!data) {
      return sendError(res, 404, `Vehicle not found for id "${id}".`);
    }

    return sendSuccess(res, 200, 'Vehicle fetched successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to fetch vehicle.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function createVehicle(req, res) {
  try {
    const payload = buildVehiclePayload(req.body);
    validateVehiclePayload(payload);

    const { data, error } = await supabase
      .from('vehicles')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (isUniqueRegistrationError(error)) {
        return sendError(
          res,
          409,
          `A vehicle with registration number "${payload.registration_number}" already exists.`
        );
      }

      return sendError(res, 500, getErrorMessage(error));
    }

    return sendSuccess(res, 201, 'Vehicle created successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to create vehicle.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function updateVehicle(req, res) {
  try {
    const { id } = req.params;
    const payload = buildVehiclePayload(req.body, { partial: true });

    if (Object.keys(payload).length === 0) {
      return sendError(res, 400, 'No valid fields provided for update.');
    }

    validateVehiclePayload(payload, { partial: true });

    const { data, error } = await supabase
      .from('vehicles')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      if (isUniqueRegistrationError(error)) {
        return sendError(
          res,
          409,
          `A vehicle with registration number "${payload.registration_number}" already exists.`
        );
      }

      return sendError(res, 500, getErrorMessage(error));
    }

    if (!data) {
      return sendError(res, 404, `Vehicle not found for id "${id}".`);
    }

    return sendSuccess(res, 200, 'Vehicle updated successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to update vehicle.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function deleteVehicle(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      if (error.code === '23503') {
        return sendError(
          res,
          409,
          'Vehicle cannot be deleted because it is linked to existing trips or records.'
        );
      }

      return sendError(res, 500, getErrorMessage(error));
    }

    if (!data) {
      return sendError(res, 404, `Vehicle not found for id "${id}".`);
    }

    return sendSuccess(res, 200, 'Vehicle deleted successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to delete vehicle.');
  }
}

module.exports = {
  listVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};