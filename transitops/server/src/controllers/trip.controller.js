const supabase = require('../supabaseClient');
const {
  createTrip: createTripService,
  dispatchTrip: dispatchTripService,
  completeTrip: completeTripService,
  cancelTrip: cancelTripService,
  getAssignableResources: getAssignableResourcesService,
} = require('../services/tripEngine');

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
 * @param {string} message
 * @returns {number}
 */
function mapServiceErrorStatus(message) {
  if (/not found/i.test(message)) {
    return 404;
  }

  if (/database operation failed|unknown error/i.test(message)) {
    return 500;
  }

  return 400;
}

/**
 * @param {import('express').Response} res
 * @param {{ success: boolean, message: string, data?: unknown }} result
 * @param {number} [successStatus=200]
 */
function respondServiceResult(res, result, successStatus = 200) {
  if (result.success) {
    return sendSuccess(res, successStatus, result.message, result.data ?? null);
  }

  return sendError(
    res,
    mapServiceErrorStatus(result.message),
    result.message,
    result.data ?? null
  );
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function listTrips(req, res) {
  try {
    const { status, vehicle_id: vehicleId, driver_id: driverId } = req.query;

    let query = supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }

    if (driverId) {
      query = query.eq('driver_id', driverId);
    }

    const { data, error } = await query;

    if (error) {
      return sendError(res, 500, getErrorMessage(error));
    }

    return sendSuccess(res, 200, 'Trips fetched successfully.', data || []);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to fetch trips.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getTripById(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return sendError(res, 500, getErrorMessage(error));
    }

    if (!data) {
      return sendError(res, 404, `Trip not found for id "${id}".`);
    }

    return sendSuccess(res, 200, 'Trip fetched successfully.', data);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to fetch trip.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function createTrip(req, res) {
  const result = await createTripService(req.body);
  return respondServiceResult(res, result, 201);
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function dispatchTrip(req, res) {
  const result = await dispatchTripService(req.params.id);
  return respondServiceResult(res, result);
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function completeTrip(req, res) {
  const result = await completeTripService(req.params.id, req.body);
  return respondServiceResult(res, result);
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function cancelTrip(req, res) {
  const result = await cancelTripService(req.params.id);
  return respondServiceResult(res, result);
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getAssignableResources(req, res) {
  const result = await getAssignableResourcesService();
  return respondServiceResult(res, result);
}

module.exports = {
  listTrips,
  getTripById,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getAssignableResources,
};
