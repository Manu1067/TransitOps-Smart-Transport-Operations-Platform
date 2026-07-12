const supabase = require('../supabaseClient');
const { VEHICLE_STATUSES, DRIVER_STATUSES, TRIP_STATUSES } = require('../utils/validators');

const TRIP_STATUS_DRAFT = TRIP_STATUSES.DRAFT;
const TRIP_STATUS_DISPATCHED = TRIP_STATUSES.DISPATCHED;

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
 * @param {number | null | undefined} value
 * @param {number} [decimals=2]
 * @returns {number}
 */
function round(value, decimals = 2) {
  if (value == null || !Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * @param {string | null | undefined} registrationNumber
 * @returns {string | null}
 */
function extractRegionFromRegistration(registrationNumber) {
  if (!registrationNumber) {
    return null;
  }

  const [regionCode] = String(registrationNumber).trim().split('-');
  return regionCode ? regionCode.toUpperCase() : null;
}

/**
 * @param {string | null | undefined} licenseNumber
 * @returns {string | null}
 */
function extractRegionFromLicense(licenseNumber) {
  if (!licenseNumber) {
    return null;
  }

  const [regionCode] = String(licenseNumber).trim().split('-');
  return regionCode ? regionCode.toUpperCase() : null;
}

/**
 * @param {Record<string, unknown>} filters
 * @returns {boolean}
 */
function hasVehicleFilters(filters) {
  return Boolean(filters.vehicleType || filters.status || filters.region);
}

/**
 * @param {Array<Record<string, unknown>>} vehicles
 * @param {Record<string, unknown>} [filters={}]
 * @returns {Array<Record<string, unknown>>}
 */
function filterVehicles(vehicles, filters = {}) {
  return (vehicles || []).filter((vehicle) => {
    if (filters.status && vehicle.status !== filters.status) {
      return false;
    }

    if (filters.vehicleType) {
      const search = String(filters.vehicleType).trim().toLowerCase();
      const make = String(vehicle.make || '').toLowerCase();
      const model = String(vehicle.model || '').toLowerCase();

      if (!make.includes(search) && !model.includes(search)) {
        return false;
      }
    }

    if (filters.region) {
      const region = String(filters.region).trim().toUpperCase();
      const vehicleRegion = extractRegionFromRegistration(vehicle.registration_number);

      if (vehicleRegion !== region) {
        return false;
      }
    }

    return true;
  });
}

/**
 * @param {Array<Record<string, unknown>>} drivers
 * @param {Record<string, unknown>} [filters={}]
 * @returns {Array<Record<string, unknown>>}
 */
function filterDrivers(drivers, filters = {}) {
  return (drivers || []).filter((driver) => {
    if (filters.driverStatus && driver.status !== filters.driverStatus) {
      return false;
    }

    if (filters.region) {
      const region = String(filters.region).trim().toUpperCase();
      const driverRegion = extractRegionFromLicense(driver.license_number);

      if (driverRegion !== region) {
        return false;
      }
    }

    return true;
  });
}

/**
 * @param {Array<Record<string, unknown>>} trips
 * @param {Set<string>} vehicleIds
 * @returns {Array<Record<string, unknown>>}
 */
function filterTripsByVehicles(trips, vehicleIds) {
  if (!vehicleIds || vehicleIds.size === 0) {
    return [];
  }

  return (trips || []).filter((trip) => vehicleIds.has(String(trip.vehicle_id)));
}

/**
 * Fleet utilization % = (vehicles On Trip / total non-retired vehicles) * 100.
 *
 * @param {Array<Record<string, unknown>>} vehicles
 * @returns {number}
 */
function calculateFleetUtilization(vehicles) {
  const fleet = vehicles || [];
  const nonRetiredVehicles = fleet.filter(
    (vehicle) => vehicle.status !== VEHICLE_STATUSES.RETIRED
  );

  if (nonRetiredVehicles.length === 0) {
    return 0;
  }

  const vehiclesOnTrip = nonRetiredVehicles.filter(
    (vehicle) => vehicle.status === VEHICLE_STATUSES.ON_TRIP
  ).length;

  return round((vehiclesOnTrip / nonRetiredVehicles.length) * 100);
}

/**
 * @param {Array<Record<string, unknown>>} items
 * @param {string} statusField
 * @param {string[]} statuses
 * @returns {Record<string, number> & { total: number }}
 */
function buildStatusBreakdown(items, statusField, statuses) {
  const breakdown = statuses.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});

  (items || []).forEach((item) => {
    const status = item[statusField];
    if (status in breakdown) {
      breakdown[status] += 1;
    }
  });

  breakdown.total = (items || []).length;
  return breakdown;
}

/**
 * @param {Array<Record<string, unknown>>} vehicles
 * @param {Array<Record<string, unknown>>} drivers
 * @param {Array<Record<string, unknown>>} trips
 * @param {Record<string, unknown>} [filters={}]
 */
function composeDashboardKpis(vehicles, drivers, trips, filters = {}) {
  const filteredVehicles = filterVehicles(vehicles, filters);
  const filteredDrivers = filterDrivers(drivers, filters);

  const vehicleIds = new Set(filteredVehicles.map((vehicle) => String(vehicle.id)));
  const scopedTrips = hasVehicleFilters(filters)
    ? filterTripsByVehicles(trips, vehicleIds)
    : (trips || []);

  const activeVehicles = filteredVehicles.filter(
    (vehicle) => vehicle.status === VEHICLE_STATUSES.ON_TRIP
  ).length;

  const availableVehicles = filteredVehicles.filter(
    (vehicle) => vehicle.status === VEHICLE_STATUSES.AVAILABLE
  ).length;

  const vehiclesInMaintenance = filteredVehicles.filter(
    (vehicle) => vehicle.status === VEHICLE_STATUSES.IN_SHOP
  ).length;

  const activeTrips = scopedTrips.filter(
    (trip) => trip.status === TRIP_STATUS_DISPATCHED
  ).length;

  const pendingTrips = scopedTrips.filter(
    (trip) => trip.status === TRIP_STATUS_DRAFT
  ).length;

  const driversOnDuty = filteredDrivers.filter(
    (driver) =>
      driver.status === DRIVER_STATUSES.AVAILABLE
      || driver.status === DRIVER_STATUSES.ON_TRIP
  ).length;

  const fleetUtilization = calculateFleetUtilization(filteredVehicles);

  return {
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilization,
    meta: {
      filtersApplied: {
        vehicleType: filters.vehicleType || null,
        status: filters.status || null,
        region: filters.region || null,
        driverStatus: filters.driverStatus || null,
      },
      totals: {
        vehicles: filteredVehicles.length,
        drivers: filteredDrivers.length,
        trips: scopedTrips.length,
      },
    },
  };
}

/**
 * @param {Record<string, unknown>} [filters={}]
 */
async function fetchDashboardData(filters = {}) {
  let vehicleQuery = supabase.from('vehicles').select('*');
  let driverQuery = supabase.from('drivers').select('*');
  const tripQuery = supabase.from('trips').select('*');

  if (filters.status) {
    vehicleQuery = vehicleQuery.eq('status', filters.status);
  }

  if (filters.region) {
    const region = String(filters.region).trim().toUpperCase();
    vehicleQuery = vehicleQuery.ilike('registration_number', `${region}-%`);
    driverQuery = driverQuery.ilike('license_number', `${region}-%`);
  }

  if (filters.driverStatus) {
    driverQuery = driverQuery.eq('status', filters.driverStatus);
  }

  const [vehiclesResult, driversResult, tripsResult] = await Promise.all([
    vehicleQuery,
    driverQuery,
    tripQuery,
  ]);

  if (vehiclesResult.error) {
    throw new Error(getErrorMessage(vehiclesResult.error));
  }

  if (driversResult.error) {
    throw new Error(getErrorMessage(driversResult.error));
  }

  if (tripsResult.error) {
    throw new Error(getErrorMessage(tripsResult.error));
  }

  return {
    vehicles: vehiclesResult.data || [],
    drivers: driversResult.data || [],
    trips: tripsResult.data || [],
  };
}

/**
 * Build dashboard KPI metrics from Supabase data.
 *
 * @param {Record<string, unknown>} [filters={}]
 */
async function buildDashboardKpis(filters = {}) {
  try {
    const { vehicles, drivers, trips } = await fetchDashboardData(filters);
    const kpis = composeDashboardKpis(vehicles, drivers, trips, filters);

    return ok(kpis, 'Dashboard KPIs generated successfully.');
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

/**
 * Return vehicle counts grouped by operational status.
 *
 * @param {Record<string, unknown>} [filters={}]
 */
async function getVehicleStatusBreakdown(filters = {}) {
  try {
    const { vehicles } = await fetchDashboardData(filters);
    const filteredVehicles = filterVehicles(vehicles, filters);

    const breakdown = buildStatusBreakdown(filteredVehicles, 'status', [
      VEHICLE_STATUSES.AVAILABLE,
      VEHICLE_STATUSES.ON_TRIP,
      VEHICLE_STATUSES.IN_SHOP,
      VEHICLE_STATUSES.RETIRED,
    ]);

    return ok(
      {
        breakdown,
        fleetUtilization: calculateFleetUtilization(filteredVehicles),
        filtersApplied: {
          vehicleType: filters.vehicleType || null,
          status: filters.status || null,
          region: filters.region || null,
        },
      },
      'Vehicle status breakdown generated successfully.'
    );
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

/**
 * Return driver counts grouped by duty status.
 *
 * @param {Record<string, unknown>} [filters={}]
 */
async function getDriverStatusBreakdown(filters = {}) {
  try {
    const { drivers } = await fetchDashboardData(filters);
    const filteredDrivers = filterDrivers(drivers, filters);

    const breakdown = buildStatusBreakdown(filteredDrivers, 'status', [
      DRIVER_STATUSES.AVAILABLE,
      DRIVER_STATUSES.ON_TRIP,
      DRIVER_STATUSES.OFF_DUTY,
      DRIVER_STATUSES.SUSPENDED,
    ]);

    const driversOnDuty = filteredDrivers.filter(
      (driver) =>
        driver.status === DRIVER_STATUSES.AVAILABLE
        || driver.status === DRIVER_STATUSES.ON_TRIP
    ).length;

    return ok(
      {
        breakdown,
        driversOnDuty,
        filtersApplied: {
          region: filters.region || null,
          driverStatus: filters.driverStatus || null,
        },
      },
      'Driver status breakdown generated successfully.'
    );
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

module.exports = {
  calculateFleetUtilization,
  buildDashboardKpis,
  getVehicleStatusBreakdown,
  getDriverStatusBreakdown,
};