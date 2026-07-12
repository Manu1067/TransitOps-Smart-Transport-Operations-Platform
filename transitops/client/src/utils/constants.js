/** Application roles (matches profiles.role CHECK constraint). */
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  DISPATCHER: 'dispatcher',
  DRIVER: 'driver',
  VIEWER: 'viewer',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: 'Admin',
  [ROLES.DISPATCHER]: 'Dispatcher',
  [ROLES.DRIVER]: 'Driver',
  [ROLES.VIEWER]: 'Viewer',
});

/** Vehicle operational statuses (matches vehicles.status). */
export const VEHICLE_STATUSES = Object.freeze({
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired',
});

/** Driver availability statuses (matches drivers.status). */
export const DRIVER_STATUSES = Object.freeze({
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  OFF_DUTY: 'Off Duty',
  SUSPENDED: 'Suspended',
});

/** Trip lifecycle statuses (matches trips.status). */
export const TRIP_STATUSES = Object.freeze({
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
});

/** Maintenance log statuses (matches maintenance_logs.status). */
export const MAINTENANCE_STATUSES = Object.freeze({
  ACTIVE: 'Active',
  CLOSED: 'Closed',
});

/** Expense categories (matches expenses.expense_type). */
export const EXPENSE_TYPES = Object.freeze({
  TOLL: 'Toll',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Other',
});

/**
 * Fleet vehicle type categories for forms and filters.
 * Common transport classifications used alongside make/model.
 */
export const VEHICLE_TYPES = Object.freeze({
  TRUCK: 'Truck',
  TRAILER: 'Trailer',
  TANKER: 'Tanker',
  BUS: 'Bus',
  LCV: 'LCV',
});

export const ALL_ROLES = Object.freeze(Object.values(ROLES));
export const ALL_VEHICLE_STATUSES = Object.freeze(Object.values(VEHICLE_STATUSES));
export const ALL_DRIVER_STATUSES = Object.freeze(Object.values(DRIVER_STATUSES));
export const ALL_TRIP_STATUSES = Object.freeze(Object.values(TRIP_STATUSES));
export const ALL_MAINTENANCE_STATUSES = Object.freeze(Object.values(MAINTENANCE_STATUSES));
export const ALL_EXPENSE_TYPES = Object.freeze(Object.values(EXPENSE_TYPES));
export const ALL_VEHICLE_TYPES = Object.freeze(Object.values(VEHICLE_TYPES));
