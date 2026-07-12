/**
 * TransitOps transport business-rule validators.
 * Framework-agnostic helpers for use in services, routes, and jobs.
 */

/** @typedef {'Available' | 'On Trip' | 'Off Duty' | 'Suspended'} DriverStatus */
/** @typedef {'Available' | 'On Trip' | 'In Shop' | 'Retired'} VehicleStatus */
/** @typedef {'Draft' | 'Dispatched' | 'Completed' | 'Cancelled'} TripStatus */

const DRIVER_STATUSES = Object.freeze({
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  OFF_DUTY: 'Off Duty',
  SUSPENDED: 'Suspended',
});

const VEHICLE_STATUSES = Object.freeze({
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired',
});

const TRIP_STATUSES = Object.freeze({
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
});

/**
 * Normalize a date-like value to midnight UTC for day-level comparison.
 * @param {string | Date} value
 * @returns {Date}
 */
function toDateOnly(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value provided.');
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Returns true when the driving license expired before the reference date.
 * A license is valid through the expiry date itself (inclusive).
 *
 * @param {string | Date | null | undefined} expiryDate
 * @param {string | Date} [referenceDate=new Date()]
 * @returns {boolean}
 */
function isLicenseExpired(expiryDate, referenceDate = new Date()) {
  if (expiryDate == null || expiryDate === '') {
    return false;
  }

  const expiry = toDateOnly(expiryDate);
  const reference = toDateOnly(referenceDate);

  return reference.getTime() > expiry.getTime();
}

/**
 * Ensures a driver can be assigned to a trip.
 * Blocks Suspended drivers, expired licenses, and drivers not Available.
 *
 * @param {{ full_name?: string, status?: DriverStatus, license_expiry_date?: string | Date | null }} driver
 * @param {string | Date} [referenceDate=new Date()]
 * @throws {Error}
 */
function ensureDriverAssignable(driver, referenceDate = new Date()) {
  if (!driver || typeof driver !== 'object') {
    throw new Error('A valid driver record is required for assignment.');
  }

  const driverLabel = driver.full_name || 'Driver';

  if (driver.status === DRIVER_STATUSES.SUSPENDED) {
    throw new Error(`${driverLabel} is Suspended and cannot be assigned to a trip.`);
  }

  if (driver.status === DRIVER_STATUSES.ON_TRIP) {
    throw new Error(`${driverLabel} is already On Trip and cannot be assigned to another trip.`);
  }

  if (driver.status === DRIVER_STATUSES.OFF_DUTY) {
    throw new Error(`${driverLabel} is Off Duty and cannot be assigned to a trip.`);
  }

  if (driver.status !== DRIVER_STATUSES.AVAILABLE) {
    throw new Error(
      `${driverLabel} has status "${driver.status ?? 'unknown'}" and cannot be assigned to a trip.`
    );
  }

  if (driver.license_expiry_date == null || driver.license_expiry_date === '') {
    throw new Error(`${driverLabel} does not have a license expiry date on file and cannot be assigned.`);
  }

  if (isLicenseExpired(driver.license_expiry_date, referenceDate)) {
    throw new Error(`${driverLabel}'s driving license has expired and cannot be assigned to a trip.`);
  }
}

/**
 * Ensures a vehicle can be dispatched.
 * Only Available vehicles may be dispatched.
 *
 * @param {{ registration_number?: string, status?: VehicleStatus }} vehicle
 * @throws {Error}
 */
function ensureVehicleDispatchable(vehicle) {
  if (!vehicle || typeof vehicle !== 'object') {
    throw new Error('A valid vehicle record is required for dispatch.');
  }

  const vehicleLabel = vehicle.registration_number || 'Vehicle';

  if (vehicle.status === VEHICLE_STATUSES.RETIRED) {
    throw new Error(`${vehicleLabel} is Retired and cannot be dispatched.`);
  }

  if (vehicle.status === VEHICLE_STATUSES.IN_SHOP) {
    throw new Error(`${vehicleLabel} is In Shop and cannot be dispatched.`);
  }

  if (vehicle.status === VEHICLE_STATUSES.ON_TRIP) {
    throw new Error(`${vehicleLabel} is already On Trip and cannot be dispatched.`);
  }

  if (vehicle.status !== VEHICLE_STATUSES.AVAILABLE) {
    throw new Error(
      `${vehicleLabel} has status "${vehicle.status ?? 'unknown'}" and cannot be dispatched.`
    );
  }
}

/**
 * Ensures cargo weight does not exceed the vehicle's maximum load capacity.
 *
 * @param {number | string | null | undefined} cargoWeight
 * @param {number | string | null | undefined} maxLoadCapacity
 * @throws {Error}
 * @returns {number} Validated cargo weight
 */
function ensureCargoWithinCapacity(cargoWeight, maxLoadCapacity) {
  const weight = ensureNonNegativeNumber(cargoWeight, 'Cargo weight');

  if (maxLoadCapacity == null || maxLoadCapacity === '') {
    throw new Error('Maximum load capacity is required to validate cargo weight.');
  }

  const capacity = ensureNonNegativeNumber(maxLoadCapacity, 'Maximum load capacity');

  if (capacity === 0) {
    throw new Error('Maximum load capacity must be greater than zero.');
  }

  if (weight > capacity) {
    throw new Error(
      `Cargo weight (${weight} tonnes) exceeds vehicle capacity (${capacity} tonnes).`
    );
  }

  return weight;
}

/**
 * Ensures a trip is in Draft status (editable / pre-dispatch).
 *
 * @param {{ status?: TripStatus }} trip
 * @throws {Error}
 */
function ensureTripIsDraft(trip) {
  if (!trip || typeof trip !== 'object') {
    throw new Error('A valid trip record is required.');
  }

  if (trip.status !== TRIP_STATUSES.DRAFT) {
    throw new Error(
      `Trip must be in Draft status to perform this action (current status: "${trip.status ?? 'unknown'}").`
    );
  }
}

/**
 * Ensures a trip is in Dispatched status (in progress).
 *
 * @param {{ status?: TripStatus }} trip
 * @throws {Error}
 */
function ensureTripIsDispatched(trip) {
  if (!trip || typeof trip !== 'object') {
    throw new Error('A valid trip record is required.');
  }

  if (trip.status !== TRIP_STATUSES.DISPATCHED) {
    throw new Error(
      `Trip must be in Dispatched status to perform this action (current status: "${trip.status ?? 'unknown'}").`
    );
  }
}

/**
 * Ensures a numeric value is present and non-negative.
 *
 * @param {number | string | null | undefined} value
 * @param {string} fieldName
 * @throws {Error}
 * @returns {number}
 */
function ensureNonNegativeNumber(value, fieldName) {
  const label = fieldName || 'Value';

  if (value === null || value === undefined || value === '') {
    throw new Error(`${label} is required and must be a valid number.`);
  }

  const num = Number(value);

  if (Number.isNaN(num)) {
    throw new Error(`${label} must be a valid number.`);
  }

  if (num < 0) {
    throw new Error(`${label} must be zero or greater.`);
  }

  return num;
}

/**
 * Ensures all listed fields are present and non-empty on a payload object.
 *
 * @param {Record<string, unknown>} payload
 * @param {string[]} fields
 * @throws {Error}
 */
function ensureRequiredFields(payload, fields) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Request payload must be a non-null object.');
  }

  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error('At least one required field must be specified.');
  }

  const missing = fields.filter((field) => {
    const value = payload[field];
    return (
      value === undefined
      || value === null
      || (typeof value === 'string' && value.trim() === '')
    );
  });

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}.`);
  }
}

module.exports = {
  DRIVER_STATUSES,
  VEHICLE_STATUSES,
  TRIP_STATUSES,
  isLicenseExpired,
  ensureDriverAssignable,
  ensureVehicleDispatchable,
  ensureCargoWithinCapacity,
  ensureTripIsDraft,
  ensureTripIsDispatched,
  ensureNonNegativeNumber,
  ensureRequiredFields,
};
