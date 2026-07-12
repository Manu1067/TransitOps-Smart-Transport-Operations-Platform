const {
    buildFleetCostSummary,
    buildVehicleCostSummary,
  } = require('../services/costEngine');
  const { calculateFleetUtilization } = require('../services/utilizationEngine');
  const csvExport = require('../utils/csvExport');
  const supabase = require('../supabaseClient');
  const { VEHICLE_STATUSES } = require('../utils/validators');
  
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
   * @param {Record<string, unknown>} costSummary
   * @returns {number | null}
   */
  function calculateVehicleUtilization(costSummary) {
    const totalTrips = Number(costSummary.counts?.trips ?? 0);
    const completedTrips = Number(costSummary.counts?.completedTrips ?? 0);
  
    if (totalTrips <= 0) {
      return costSummary.status === VEHICLE_STATUSES.ON_TRIP ? 100 : 0;
    }
  
    return Math.round((completedTrips / totalTrips) * 10000) / 100;
  }
  
  /**
   * @param {Record<string, unknown>} costSummary
   */
  function buildVehicleReport(costSummary) {
    return {
      vehicle: {
        id: costSummary.vehicleId,
        registrationNumber: costSummary.registrationNumber,
        make: costSummary.make,
        model: costSummary.model,
        status: costSummary.status,
      },
      fuelEfficiency: {
        value: costSummary.totals?.fuelEfficiency ?? null,
        unit: 'km/L',
      },
      utilization: {
        percentage: calculateVehicleUtilization(costSummary),
      },
      operationalCost: {
        total: costSummary.totals?.operationalCost ?? 0,
        fuelCost: costSummary.totals?.fuelCost ?? 0,
        maintenanceCost: costSummary.totals?.maintenanceCost ?? 0,
      },
      roi: {
        value: costSummary.totals?.roi ?? null,
        percentage:
          costSummary.totals?.roi != null
            ? Math.round(Number(costSummary.totals.roi) * 10000) / 100
            : null,
        netReturn: costSummary.totals?.netReturn ?? 0,
        revenue: costSummary.totals?.revenue ?? 0,
        acquisitionCost: costSummary.totals?.acquisitionCost ?? 0,
      },
      counts: costSummary.counts ?? {},
    };
  }
  
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async function getFleetReport(req, res) {
    try {
      const costResult = await buildFleetCostSummary();
  
      if (!costResult.success) {
        return respondServiceResult(res, costResult);
      }
  
      const { data: vehicles, error } = await supabase.from('vehicles').select('*');
  
      if (error) {
        return sendError(res, 500, error.message || 'Failed to fetch vehicles.');
      }
  
      const vehicleReports = (costResult.data?.vehicles || []).map(buildVehicleReport);
  
      return sendSuccess(res, 200, 'Fleet report generated successfully.', {
        summary: {
          vehicleCount: costResult.data?.vehicleCount ?? vehicleReports.length,
          fleetUtilization: calculateFleetUtilization(vehicles || []),
          fuelEfficiency: {
            value: costResult.data?.fleetTotals?.fuelEfficiency ?? null,
            unit: 'km/L',
          },
          operationalCost: costResult.data?.fleetTotals?.operationalCost ?? 0,
          roi: {
            value: costResult.data?.fleetTotals?.roi ?? null,
            percentage:
              costResult.data?.fleetTotals?.roi != null
                ? Math.round(Number(costResult.data.fleetTotals.roi) * 10000) / 100
                : null,
          },
          totals: costResult.data?.fleetTotals ?? {},
        },
        vehicles: vehicleReports,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      return sendError(res, 500, error.message || 'Failed to generate fleet report.');
    }
  }
  
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async function getVehicleReport(req, res) {
    try {
      const { id } = req.params;
      const costResult = await buildVehicleCostSummary(id);
  
      if (!costResult.success) {
        return respondServiceResult(res, costResult);
      }
  
      return sendSuccess(res, 200, 'Vehicle report generated successfully.', {
        ...buildVehicleReport(costResult.data),
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      return sendError(res, 500, error.message || 'Failed to generate vehicle report.');
    }
  }
  
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async function exportFleetCsv(req, res) {
    try {
      const costResult = await buildFleetCostSummary();
  
      if (!costResult.success) {
        return respondServiceResult(res, costResult);
      }
  
      const { data: vehicles, error } = await supabase.from('vehicles').select('*');
  
      if (error) {
        return sendError(res, 500, error.message || 'Failed to fetch vehicles.');
      }
  
      const fleetUtilization = calculateFleetUtilization(vehicles || []);
      const rows = (costResult.data?.vehicles || []).map((summary) => {
        const report = buildVehicleReport(summary);
  
        return {
          registration_number: report.vehicle.registrationNumber,
          make: report.vehicle.make,
          model: report.vehicle.model,
          status: report.vehicle.status,
          fuel_efficiency_km_per_l: report.fuelEfficiency.value ?? '',
          utilization_percent: report.utilization.percentage ?? '',
          operational_cost: report.operationalCost.total ?? '',
          roi_percent: report.roi.percentage ?? '',
          revenue: report.roi.revenue ?? '',
          net_return: report.roi.netReturn ?? '',
        };
      });
  
      rows.push({
        registration_number: 'FLEET TOTAL',
        make: '',
        model: '',
        status: '',
        fuel_efficiency_km_per_l: costResult.data?.fleetTotals?.fuelEfficiency ?? '',
        utilization_percent: fleetUtilization,
        operational_cost: costResult.data?.fleetTotals?.operationalCost ?? '',
        roi_percent:
          costResult.data?.fleetTotals?.roi != null
            ? Math.round(Number(costResult.data.fleetTotals.roi) * 10000) / 100
            : '',
        revenue: costResult.data?.fleetTotals?.revenue ?? '',
        net_return: costResult.data?.fleetTotals?.netReturn ?? '',
      });
  
      const csv = csvExport.generateCsv(rows);
      const filename = `fleet-report-${new Date().toISOString().slice(0, 10)}.csv`;
  
      csvExport.setDownloadHeaders(res, filename);
      return res.status(200).send(csv);
    } catch (error) {
      return sendError(res, 500, error.message || 'Failed to export fleet report.');
    }
  }
  
  module.exports = {
    getFleetReport,
    getVehicleReport,
    exportFleetCsv,
  };