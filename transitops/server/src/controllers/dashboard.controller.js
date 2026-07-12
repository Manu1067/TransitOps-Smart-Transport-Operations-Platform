const {
  buildDashboardKpis,
  getVehicleStatusBreakdown: getVehicleStatusBreakdownService,
  getDriverStatusBreakdown: getDriverStatusBreakdownService,
} = require('../services/utilizationEngine');

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
 * @param {import('express').Request['query']} query
 * @returns {Record<string, string>}
 */
function parseDashboardFilters(query = {}) {
  /** @type {Record<string, string>} */
  const filters = {};

  const vehicleType = query.vehicleType || query.type;
  const status = query.status;
  const region = query.region;
  const driverStatus = query.driverStatus || query.driver_status;

  if (vehicleType) {
    filters.vehicleType = String(vehicleType);
  }

  if (status) {
    filters.status = String(status);
  }

  if (region) {
    filters.region = String(region);
  }

  if (driverStatus) {
    filters.driverStatus = String(driverStatus);
  }

  return filters;
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getDashboardKpis(req, res) {
  const filters = parseDashboardFilters(req.query);
  const result = await buildDashboardKpis(filters);
  return respondServiceResult(res, result);
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getVehicleStatusBreakdown(req, res) {
  const filters = parseDashboardFilters(req.query);
  const result = await getVehicleStatusBreakdownService(filters);
  return respondServiceResult(res, result);
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getDriverStatusBreakdown(req, res) {
  const filters = parseDashboardFilters(req.query);
  const result = await getDriverStatusBreakdownService(filters);
  return respondServiceResult(res, result);
}

module.exports = {
  getDashboardKpis,
  getVehicleStatusBreakdown,
  getDriverStatusBreakdown,
};