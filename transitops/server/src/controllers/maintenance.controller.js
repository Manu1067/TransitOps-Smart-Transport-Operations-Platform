const supabase = require('../supabaseClient');
const {
  createMaintenanceLog: createMaintenanceLogService,
  closeMaintenanceLog: closeMaintenanceLogService,
} = require('../services/maintenanceEngine');

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
async function listMaintenanceLogs(req, res) {
  try {
    const { vehicle_id: vehicleId, status } = req.query;

    let query = supabase
      .from('maintenance_logs')
      .select(`
        *,
        vehicle:vehicles (
          id,
          registration_number,
          make,
          model,
          status,
          current_odometer
        )
      `)
      .order('started_at', { ascending: false });

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return sendError(res, 500, getErrorMessage(error));
    }

    return sendSuccess(res, 200, 'Maintenance logs fetched successfully.', data || []);
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to fetch maintenance logs.');
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function createMaintenanceLog(req, res) {
  const result = await createMaintenanceLogService(req.body);
  return respondServiceResult(res, result, 201);
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function closeMaintenanceLog(req, res) {
  const result = await closeMaintenanceLogService(req.params.id, req.body);
  return respondServiceResult(res, result);
}

module.exports = {
  listMaintenanceLogs,
  createMaintenanceLog,
  closeMaintenanceLog,
};