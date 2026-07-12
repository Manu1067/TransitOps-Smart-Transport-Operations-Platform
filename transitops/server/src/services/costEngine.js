const supabase = require('../supabaseClient');

const TRIP_STATUS_COMPLETED = 'Completed';
const EXPENSE_TYPE_MAINTENANCE = 'Maintenance';

/**
 * @param {unknown} data
 * @param {string} [message='Success']
 * @returns {{ success: true, message: string, data: unknown }}
 */
function ok(data, message = 'Success') {
  return { success: true, message, data };
}

/**
 * @param {string} message
 * @param {unknown} [data=null]
 * @returns {{ success: false, message: string, data: unknown }}
 */
function fail(message, data = null) {
  return { success: false, message, data };
}

/**
 * @param {import('@supabase/supabase-js').PostgrestError | Error | null | undefined} error
 * @returns {string}
 */
function getErrorMessage(error) {
  if (!error) {
    return 'An unknown error occurred.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return error.message || error.details || error.hint || 'Database operation failed.';
}

/**
 * @param {unknown} value
 * @param {number} [defaultValue=0]
 * @returns {number}
 */
function toNumber(value, defaultValue = 0) {
  if (value == null || value === '') {
    return defaultValue;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
}

/**
 * @param {number | null | undefined} value
 * @param {number} [decimals=2]
 * @returns {number | null}
 */
function round(value, decimals = 2) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * @param {Array<Record<string, unknown>> | null | undefined} items
 * @param {string} field
 * @returns {number}
 */
function sumField(items, field) {
  return (items || []).reduce((total, item) => total + toNumber(item[field]), 0);
}

/**
 * @param {Array<Record<string, unknown>> | null | undefined} expenses
 * @returns {number}
 */
function sumMaintenanceExpenses(expenses) {
  return (expenses || [])
    .filter((expense) => expense.expense_type === EXPENSE_TYPE_MAINTENANCE)
    .reduce((total, expense) => total + toNumber(expense.amount), 0);
}

/**
 * Operational cost = total fuel cost + maintenance-related expenses.
 *
 * @param {{ fuelLogs?: Array<Record<string, unknown>>, expenses?: Array<Record<string, unknown>> }} params
 * @returns {number}
 */
function calculateOperationalCost({ fuelLogs = [], expenses = [] } = {}) {
  const fuelCost = sumField(fuelLogs, 'cost');
  const maintenanceCost = sumMaintenanceExpenses(expenses);

  return round(fuelCost + maintenanceCost) ?? 0;
}

/**
 * Fuel efficiency = distance / fuel consumed (km per liter).
 *
 * @param {number | string | null | undefined} distance
 * @param {number | string | null | undefined} fuelConsumed
 * @returns {number | null}
 */
function calculateFuelEfficiency(distance, fuelConsumed) {
  const distanceValue = toNumber(distance);
  const fuelValue = toNumber(fuelConsumed);

  if (fuelValue <= 0) {
    return null;
  }

  return round(distanceValue / fuelValue);
}

/**
 * ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost.
 *
 * @param {{ revenue?: number | string | null, maintenanceCost?: number | string | null, fuelCost?: number | string | null, acquisitionCost?: number | string | null }} params
 * @returns {number | null}
 */
function calculateVehicleROI({
  revenue = 0,
  maintenanceCost = 0,
  fuelCost = 0,
  acquisitionCost = 0,
} = {}) {
  const revenueValue = toNumber(revenue);
  const maintenanceValue = toNumber(maintenanceCost);
  const fuelValue = toNumber(fuelCost);
  const acquisitionValue = toNumber(acquisitionCost);

  if (acquisitionValue <= 0) {
    return null;
  }

  const netReturn = revenueValue - (maintenanceValue + fuelValue);
  return round(netReturn / acquisitionValue, 4);
}

/**
 * @param {string} vehicleId
 * @returns {Promise<{ success: true, data: Record<string, unknown> } | { success: false, message: string }>}
 */
async function fetchVehicleById(vehicleId) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .maybeSingle();

  if (error) {
    return fail(getErrorMessage(error));
  }

  if (!data) {
    return fail(`Vehicle not found for id "${vehicleId}".`);
  }

  return ok(data);
}

/**
 * @param {string} vehicleId
 */
async function fetchVehicleCostData(vehicleId) {
  const [
    tripsResult,
    fuelLogsResult,
    vehicleExpensesResult,
    maintenanceLogsResult,
  ] = await Promise.all([
    supabase.from('trips').select('*').eq('vehicle_id', vehicleId),
    supabase.from('fuel_logs').select('*').eq('vehicle_id', vehicleId),
    supabase.from('expenses').select('*').eq('vehicle_id', vehicleId),
    supabase.from('maintenance_logs').select('*').eq('vehicle_id', vehicleId),
  ]);

  if (tripsResult.error) {
    throw new Error(getErrorMessage(tripsResult.error));
  }

  if (fuelLogsResult.error) {
    throw new Error(getErrorMessage(fuelLogsResult.error));
  }

  if (vehicleExpensesResult.error) {
    throw new Error(getErrorMessage(vehicleExpensesResult.error));
  }

  if (maintenanceLogsResult.error) {
    throw new Error(getErrorMessage(maintenanceLogsResult.error));
  }

  const trips = tripsResult.data || [];
  const tripIds = trips.map((trip) => trip.id);

  let tripExpenses = [];

  if (tripIds.length > 0) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .in('trip_id', tripIds);

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    tripExpenses = data || [];
  }

  const expensesById = new Map();

  [...(vehicleExpensesResult.data || []), ...tripExpenses].forEach((expense) => {
    expensesById.set(expense.id, expense);
  });

  return {
    trips,
    fuelLogs: fuelLogsResult.data || [],
    expenses: Array.from(expensesById.values()),
    maintenanceLogs: maintenanceLogsResult.data || [],
  };
}

/**
 * @param {Record<string, unknown>} vehicle
 * @param {Array<Record<string, unknown>>} trips
 * @param {Array<Record<string, unknown>>} fuelLogs
 * @param {Array<Record<string, unknown>>} expenses
 * @param {Array<Record<string, unknown>>} maintenanceLogs
 */
function aggregateVehicleCostMetrics(vehicle, trips, fuelLogs, expenses, maintenanceLogs) {
  const completedTrips = trips.filter((trip) => trip.status === TRIP_STATUS_COMPLETED);

  const totalRevenue = round(sumField(completedTrips, 'revenue')) ?? 0;
  const totalDistance = round(sumField(completedTrips, 'actual_distance')) ?? 0;
  const fuelCost = round(sumField(fuelLogs, 'cost')) ?? 0;
  const totalFuelLiters = round(sumField(fuelLogs, 'liters')) ?? 0;
  const tripFuelConsumed = round(sumField(completedTrips, 'fuel_consumed')) ?? 0;

  const maintenanceExpenseCost = round(sumMaintenanceExpenses(expenses)) ?? 0;
  const maintenanceLogCost = round(sumField(maintenanceLogs, 'cost')) ?? 0;
  const maintenanceCost = round(maintenanceExpenseCost + maintenanceLogCost) ?? 0;

  const operationalCost = round(
    calculateOperationalCost({ fuelLogs, expenses }) + maintenanceLogCost
  ) ?? 0;
  const acquisitionCost = round(toNumber(vehicle.acquisition_cost)) ?? 0;

  const fuelConsumedForEfficiency = totalFuelLiters > 0 ? totalFuelLiters : tripFuelConsumed;
  const fuelEfficiency = calculateFuelEfficiency(totalDistance, fuelConsumedForEfficiency);

  const roi = calculateVehicleROI({
    revenue: totalRevenue,
    maintenanceCost,
    fuelCost,
    acquisitionCost,
  });

  return {
    vehicleId: vehicle.id,
    registrationNumber: vehicle.registration_number,
    make: vehicle.make,
    model: vehicle.model,
    status: vehicle.status,
    totals: {
      revenue: totalRevenue,
      fuelCost,
      maintenanceCost,
      maintenanceExpenseCost,
      maintenanceLogCost,
      operationalCost,
      acquisitionCost,
      netReturn: round(totalRevenue - (maintenanceCost + fuelCost)) ?? 0,
      roi,
      totalDistance,
      totalFuelLiters,
      tripFuelConsumed,
      fuelEfficiency,
    },
    counts: {
      trips: trips.length,
      completedTrips: completedTrips.length,
      fuelLogs: fuelLogs.length,
      expenses: expenses.length,
      maintenanceLogs: maintenanceLogs.length,
    },
  };
}

/**
 * Build a cost summary for a single vehicle from Supabase data.
 *
 * @param {string} vehicleId
 */
async function buildVehicleCostSummary(vehicleId) {
  try {
    const vehicleResult = await fetchVehicleById(vehicleId);
    if (!vehicleResult.success) {
      return fail(vehicleResult.message);
    }

    const costData = await fetchVehicleCostData(vehicleId);
    const summary = aggregateVehicleCostMetrics(
      vehicleResult.data,
      costData.trips,
      costData.fuelLogs,
      costData.expenses,
      costData.maintenanceLogs
    );

    return ok(summary, 'Vehicle cost summary generated successfully.');
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

/**
 * Build fleet-wide cost summaries and rolled-up totals.
 */
async function buildFleetCostSummary() {
  try {
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .order('registration_number', { ascending: true });

    if (vehicleError) {
      return fail(getErrorMessage(vehicleError));
    }

    const [
      tripsResult,
      fuelLogsResult,
      expensesResult,
      maintenanceLogsResult,
    ] = await Promise.all([
      supabase.from('trips').select('*'),
      supabase.from('fuel_logs').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('maintenance_logs').select('*'),
    ]);

    if (tripsResult.error) {
      return fail(getErrorMessage(tripsResult.error));
    }

    if (fuelLogsResult.error) {
      return fail(getErrorMessage(fuelLogsResult.error));
    }

    if (expensesResult.error) {
      return fail(getErrorMessage(expensesResult.error));
    }

    if (maintenanceLogsResult.error) {
      return fail(getErrorMessage(maintenanceLogsResult.error));
    }

    const trips = tripsResult.data || [];
    const fuelLogs = fuelLogsResult.data || [];
    const expenses = expensesResult.data || [];
    const maintenanceLogs = maintenanceLogsResult.data || [];

    const tripsByVehicle = groupBy(trips, 'vehicle_id');
    const fuelLogsByVehicle = groupBy(fuelLogs, 'vehicle_id');
    const maintenanceLogsByVehicle = groupBy(maintenanceLogs, 'vehicle_id');

    const tripIdsByVehicle = new Map(
      Object.entries(tripsByVehicle).map(([vehicleId, vehicleTrips]) => [
        vehicleId,
        vehicleTrips.map((trip) => trip.id),
      ])
    );

    const expensesByVehicle = groupExpensesByVehicle(expenses, tripIdsByVehicle);

    const vehicleSummaries = (vehicles || []).map((vehicle) =>
      aggregateVehicleCostMetrics(
        vehicle,
        tripsByVehicle[vehicle.id] || [],
        fuelLogsByVehicle[vehicle.id] || [],
        expensesByVehicle[vehicle.id] || [],
        maintenanceLogsByVehicle[vehicle.id] || []
      )
    );

    const fleetTotals = vehicleSummaries.reduce(
      (totals, summary) => {
        totals.revenue += summary.totals.revenue;
        totals.fuelCost += summary.totals.fuelCost;
        totals.maintenanceCost += summary.totals.maintenanceCost;
        totals.operationalCost += summary.totals.operationalCost;
        totals.acquisitionCost += summary.totals.acquisitionCost;
        totals.netReturn += summary.totals.netReturn;
        totals.totalDistance += summary.totals.totalDistance;
        totals.totalFuelLiters += summary.totals.totalFuelLiters;
        return totals;
      },
      {
        revenue: 0,
        fuelCost: 0,
        maintenanceCost: 0,
        operationalCost: 0,
        acquisitionCost: 0,
        netReturn: 0,
        totalDistance: 0,
        totalFuelLiters: 0,
      }
    );

    fleetTotals.revenue = round(fleetTotals.revenue) ?? 0;
    fleetTotals.fuelCost = round(fleetTotals.fuelCost) ?? 0;
    fleetTotals.maintenanceCost = round(fleetTotals.maintenanceCost) ?? 0;
    fleetTotals.operationalCost = round(fleetTotals.operationalCost) ?? 0;
    fleetTotals.acquisitionCost = round(fleetTotals.acquisitionCost) ?? 0;
    fleetTotals.netReturn = round(fleetTotals.netReturn) ?? 0;
    fleetTotals.totalDistance = round(fleetTotals.totalDistance) ?? 0;
    fleetTotals.totalFuelLiters = round(fleetTotals.totalFuelLiters) ?? 0;
    fleetTotals.fuelEfficiency = calculateFuelEfficiency(
      fleetTotals.totalDistance,
      fleetTotals.totalFuelLiters
    );
    fleetTotals.roi = calculateVehicleROI({
      revenue: fleetTotals.revenue,
      maintenanceCost: fleetTotals.maintenanceCost,
      fuelCost: fleetTotals.fuelCost,
      acquisitionCost: fleetTotals.acquisitionCost,
    });

    return ok(
      {
        vehicleCount: vehicleSummaries.length,
        fleetTotals,
        vehicles: vehicleSummaries,
      },
      'Fleet cost summary generated successfully.'
    );
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

/**
 * @param {Array<Record<string, unknown>>} items
 * @param {string} key
 * @returns {Record<string, Array<Record<string, unknown>>>}
 */
function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
}

/**
 * @param {Array<Record<string, unknown>>} expenses
 * @param {Map<string, string[]>} tripIdsByVehicle
 * @returns {Record<string, Array<Record<string, unknown>>>}
 */
function groupExpensesByVehicle(expenses, tripIdsByVehicle) {
  const grouped = {};

  const addExpense = (vehicleId, expense) => {
    if (!grouped[vehicleId]) {
      grouped[vehicleId] = [];
    }

    if (!grouped[vehicleId].some((existing) => existing.id === expense.id)) {
      grouped[vehicleId].push(expense);
    }
  };

  expenses.forEach((expense) => {
    if (expense.vehicle_id) {
      addExpense(String(expense.vehicle_id), expense);
      return;
    }

    if (!expense.trip_id) {
      return;
    }

    tripIdsByVehicle.forEach((tripIds, vehicleId) => {
      if (tripIds.includes(expense.trip_id)) {
        addExpense(vehicleId, expense);
      }
    });
  });

  return grouped;
}

module.exports = {
  calculateOperationalCost,
  calculateFuelEfficiency,
  calculateVehicleROI,
  buildVehicleCostSummary,
  buildFleetCostSummary,
};