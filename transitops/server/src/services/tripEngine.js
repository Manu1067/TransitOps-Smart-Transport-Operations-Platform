const supabase = require('../supabaseClient');
const {
  DRIVER_STATUSES,
  VEHICLE_STATUSES,
  TRIP_STATUSES,
  ensureDriverAssignable,
  ensureVehicleDispatchable,
  ensureCargoWithinCapacity,
  ensureTripIsDraft,
  ensureTripIsDispatched,
  ensureNonNegativeNumber,
  ensureRequiredFields,
} = require('../utils/validators');

const ACTIVE_TRIP_STATUSES = [TRIP_STATUSES.DRAFT, TRIP_STATUSES.DISPATCHED];

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
 * @param {Record<string, unknown>} vehicle
 * @param {Record<string, unknown>} [payload]
 * @returns {number | string}
 */
function resolveMaxLoadCapacity(vehicle, payload = {}) {
  const capacity = vehicle.max_load_capacity ?? payload.max_load_capacity;

  if (capacity == null || capacity === '') {
    throw new Error(
      `Maximum load capacity is not configured for vehicle ${vehicle.registration_number || vehicle.id}.`
    );
  }

  return capacity;
}

/**
 * @param {string} tripId
 * @returns {Promise<{ success: true, data: Record<string, unknown> } | { success: false, message: string }>}
 */
async function fetchTripById(tripId) {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .maybeSingle();

  if (error) {
    return fail(getErrorMessage(error));
  }

  if (!data) {
    return fail(`Trip not found for id "${tripId}".`);
  }

  return ok(data);
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
 * @param {string} driverId
 * @returns {Promise<{ success: true, data: Record<string, unknown> } | { success: false, message: string }>}
 */
async function fetchDriverById(driverId) {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .maybeSingle();

  if (error) {
    return fail(getErrorMessage(error));
  }

  if (!data) {
    return fail(`Driver not found for id "${driverId}".`);
  }

  return ok(data);
}

/**
 * Prevent double-booking by blocking vehicles/drivers already on Draft or Dispatched trips.
 *
 * @param {string} vehicleId
 * @param {string} driverId
 * @param {string} [excludeTripId]
 */
async function ensureNoActiveTripConflicts(vehicleId, driverId, excludeTripId) {
  let query = supabase
    .from('trips')
    .select('id, status, vehicle_id, driver_id, source, destination')
    .in('status', ACTIVE_TRIP_STATUSES)
    .or(`vehicle_id.eq.${vehicleId},driver_id.eq.${driverId}`);

  if (excludeTripId) {
    query = query.neq('id', excludeTripId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const conflicts = data || [];

  const vehicleConflict = conflicts.find((trip) => trip.vehicle_id === vehicleId);
  if (vehicleConflict) {
    throw new Error(
      `Vehicle is already assigned to ${vehicleConflict.status} trip ${vehicleConflict.id} (${vehicleConflict.source} → ${vehicleConflict.destination}).`
    );
  }

  const driverConflict = conflicts.find((trip) => trip.driver_id === driverId);
  if (driverConflict) {
    throw new Error(
      `Driver is already assigned to ${driverConflict.status} trip ${driverConflict.id} (${driverConflict.source} → ${driverConflict.destination}).`
    );
  }
}

/**
 * @param {Record<string, unknown>} trip
 */
function ensureTripIsCancellable(trip) {
  if (!trip || typeof trip !== 'object') {
    throw new Error('A valid trip record is required.');
  }

  if (
    trip.status !== TRIP_STATUSES.DRAFT
    && trip.status !== TRIP_STATUSES.DISPATCHED
  ) {
    throw new Error(
      `Trip must be in Draft or Dispatched status to cancel (current status: "${trip.status ?? 'unknown'}").`
    );
  }
}

/**
 * @param {Record<string, unknown>} payload
 */
async function validateTripAssignment(payload) {
  ensureRequiredFields(payload, [
    'source',
    'destination',
    'vehicle_id',
    'driver_id',
    'cargo_weight',
  ]);

  const vehicleResult = await fetchVehicleById(String(payload.vehicle_id));
  if (!vehicleResult.success) {
    throw new Error(vehicleResult.message);
  }

  const driverResult = await fetchDriverById(String(payload.driver_id));
  if (!driverResult.success) {
    throw new Error(driverResult.message);
  }

  const vehicle = vehicleResult.data;
  const driver = driverResult.data;

  ensureVehicleDispatchable(vehicle);
  ensureDriverAssignable(driver);

  const maxLoadCapacity = resolveMaxLoadCapacity(vehicle, payload);
  ensureCargoWithinCapacity(payload.cargo_weight, maxLoadCapacity);

  if (payload.planned_distance != null && payload.planned_distance !== '') {
    ensureNonNegativeNumber(payload.planned_distance, 'Planned distance');
  }

  if (payload.revenue != null && payload.revenue !== '') {
    ensureNonNegativeNumber(payload.revenue, 'Revenue');
  }

  await ensureNoActiveTripConflicts(
    String(payload.vehicle_id),
    String(payload.driver_id)
  );

  return { vehicle, driver, maxLoadCapacity };
}

/**
 * Create a new Draft trip after validating vehicle, driver, and cargo rules.
 *
 * @param {Record<string, unknown>} payload
 */
async function createTrip(payload) {
  try {
    await validateTripAssignment(payload);

    const insertPayload = {
      source: String(payload.source).trim(),
      destination: String(payload.destination).trim(),
      vehicle_id: payload.vehicle_id,
      driver_id: payload.driver_id,
      cargo_weight: Number(payload.cargo_weight),
      status: TRIP_STATUSES.DRAFT,
      planned_distance: payload.planned_distance ?? null,
      revenue: payload.revenue ?? null,
      notes: payload.notes ?? null,
    };

    const { data, error } = await supabase
      .from('trips')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      return fail(getErrorMessage(error));
    }

    return ok(data, 'Draft trip created successfully.');
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

/**
 * Dispatch a Draft trip and mark linked vehicle/driver as On Trip.
 *
 * @param {string} tripId
 */
async function dispatchTrip(tripId) {
  try {
    const tripResult = await fetchTripById(tripId);
    if (!tripResult.success) {
      return fail(tripResult.message);
    }

    const trip = tripResult.data;
    ensureTripIsDraft(trip);

    const vehicleResult = await fetchVehicleById(String(trip.vehicle_id));
    if (!vehicleResult.success) {
      return fail(vehicleResult.message);
    }

    const driverResult = await fetchDriverById(String(trip.driver_id));
    if (!driverResult.success) {
      return fail(driverResult.message);
    }

    const vehicle = vehicleResult.data;
    const driver = driverResult.data;

    ensureVehicleDispatchable(vehicle);
    ensureDriverAssignable(driver);

    if (trip.cargo_weight != null) {
      ensureCargoWithinCapacity(
        trip.cargo_weight,
        resolveMaxLoadCapacity(vehicle)
      );
    }

    await ensureNoActiveTripConflicts(
      String(trip.vehicle_id),
      String(trip.driver_id),
      String(trip.id)
    );

    const dispatchedAt = new Date().toISOString();
    const startOdometer = vehicle.current_odometer;

    const { data: updatedTrip, error: tripError } = await supabase
      .from('trips')
      .update({
        status: TRIP_STATUSES.DISPATCHED,
        dispatched_at: dispatchedAt,
        start_odometer: startOdometer,
      })
      .eq('id', tripId)
      .eq('status', TRIP_STATUSES.DRAFT)
      .select('*')
      .maybeSingle();

    if (tripError) {
      return fail(getErrorMessage(tripError));
    }

    if (!updatedTrip) {
      return fail('Trip could not be dispatched because it is no longer in Draft status.');
    }

    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ status: VEHICLE_STATUSES.ON_TRIP })
      .eq('id', trip.vehicle_id)
      .eq('status', VEHICLE_STATUSES.AVAILABLE);

    if (vehicleError) {
      await supabase
        .from('trips')
        .update({
          status: TRIP_STATUSES.DRAFT,
          dispatched_at: null,
          start_odometer: null,
        })
        .eq('id', tripId);

      return fail(getErrorMessage(vehicleError));
    }

    const { error: driverError } = await supabase
      .from('drivers')
      .update({ status: DRIVER_STATUSES.ON_TRIP })
      .eq('id', trip.driver_id)
      .eq('status', DRIVER_STATUSES.AVAILABLE);

    if (driverError) {
      await supabase
        .from('trips')
        .update({
          status: TRIP_STATUSES.DRAFT,
          dispatched_at: null,
          start_odometer: null,
        })
        .eq('id', tripId);

      await supabase
        .from('vehicles')
        .update({ status: VEHICLE_STATUSES.AVAILABLE })
        .eq('id', trip.vehicle_id);

      return fail(getErrorMessage(driverError));
    }

    return ok(updatedTrip, 'Trip dispatched successfully.');
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

/**
 * Complete a Dispatched trip and restore vehicle/driver availability.
 *
 * @param {string} tripId
 * @param {Record<string, unknown>} [completionData={}]
 */
async function completeTrip(tripId, completionData = {}) {
  try {
    const tripResult = await fetchTripById(tripId);
    if (!tripResult.success) {
      return fail(tripResult.message);
    }

    const trip = tripResult.data;
    ensureTripIsDispatched(trip);

    const tripUpdate = {
      status: TRIP_STATUSES.COMPLETED,
      completed_at: new Date().toISOString(),
    };

    if (completionData.actual_distance != null && completionData.actual_distance !== '') {
      tripUpdate.actual_distance = ensureNonNegativeNumber(
        completionData.actual_distance,
        'Actual distance'
      );
    }

    if (completionData.revenue != null && completionData.revenue !== '') {
      tripUpdate.revenue = ensureNonNegativeNumber(completionData.revenue, 'Revenue');
    }

    if (completionData.fuel_consumed != null && completionData.fuel_consumed !== '') {
      tripUpdate.fuel_consumed = ensureNonNegativeNumber(
        completionData.fuel_consumed,
        'Fuel consumed'
      );
    }

    if (completionData.end_odometer != null && completionData.end_odometer !== '') {
      tripUpdate.end_odometer = ensureNonNegativeNumber(
        completionData.end_odometer,
        'End odometer'
      );
    }

    const startOdometer = trip.start_odometer != null
      ? Number(trip.start_odometer)
      : null;
    const endOdometer = tripUpdate.end_odometer ?? null;

    if (
      startOdometer != null
      && endOdometer != null
      && endOdometer < startOdometer
    ) {
      throw new Error('End odometer must be greater than or equal to start odometer.');
    }

    const { data: updatedTrip, error: tripError } = await supabase
      .from('trips')
      .update(tripUpdate)
      .eq('id', tripId)
      .eq('status', TRIP_STATUSES.DISPATCHED)
      .select('*')
      .maybeSingle();

    if (tripError) {
      return fail(getErrorMessage(tripError));
    }

    if (!updatedTrip) {
      return fail('Trip could not be completed because it is no longer in Dispatched status.');
    }

    const vehicleUpdate = { status: VEHICLE_STATUSES.AVAILABLE };

    if (endOdometer != null) {
      vehicleUpdate.current_odometer = endOdometer;
    }

    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update(vehicleUpdate)
      .eq('id', trip.vehicle_id);

    if (vehicleError) {
      return fail(getErrorMessage(vehicleError));
    }

    const { error: driverError } = await supabase
      .from('drivers')
      .update({ status: DRIVER_STATUSES.AVAILABLE })
      .eq('id', trip.driver_id);

    if (driverError) {
      return fail(getErrorMessage(driverError));
    }

    return ok(updatedTrip, 'Trip completed successfully.');
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

/**
 * Cancel a Draft or Dispatched trip and restore resources when needed.
 *
 * @param {string} tripId
 */
async function cancelTrip(tripId) {
  try {
    const tripResult = await fetchTripById(tripId);
    if (!tripResult.success) {
      return fail(tripResult.message);
    }

    const trip = tripResult.data;
    ensureTripIsCancellable(trip);

    const wasDispatched = trip.status === TRIP_STATUSES.DISPATCHED;
    const cancelledAt = new Date().toISOString();

    const { data: updatedTrip, error: tripError } = await supabase
      .from('trips')
      .update({
        status: TRIP_STATUSES.CANCELLED,
        cancelled_at: cancelledAt,
      })
      .eq('id', tripId)
      .in('status', [TRIP_STATUSES.DRAFT, TRIP_STATUSES.DISPATCHED])
      .select('*')
      .maybeSingle();

    if (tripError) {
      return fail(getErrorMessage(tripError));
    }

    if (!updatedTrip) {
      return fail('Trip could not be cancelled because it is no longer active.');
    }

    if (wasDispatched) {
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: VEHICLE_STATUSES.AVAILABLE })
        .eq('id', trip.vehicle_id)
        .eq('status', VEHICLE_STATUSES.ON_TRIP);

      if (vehicleError) {
        return fail(getErrorMessage(vehicleError));
      }

      const { error: driverError } = await supabase
        .from('drivers')
        .update({ status: DRIVER_STATUSES.AVAILABLE })
        .eq('id', trip.driver_id)
        .eq('status', DRIVER_STATUSES.ON_TRIP);

      if (driverError) {
        return fail(getErrorMessage(driverError));
      }
    }

    return ok(updatedTrip, 'Trip cancelled successfully.');
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

/**
 * List vehicles and drivers currently eligible for new trip assignment.
 */
async function getAssignableResources() {
  try {
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', VEHICLE_STATUSES.AVAILABLE)
      .order('registration_number', { ascending: true });

    if (vehicleError) {
      return fail(getErrorMessage(vehicleError));
    }

    const { data: drivers, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', DRIVER_STATUSES.AVAILABLE)
      .order('full_name', { ascending: true });

    if (driverError) {
      return fail(getErrorMessage(driverError));
    }

    const today = new Date().toISOString().slice(0, 10);

    const assignableDrivers = (drivers || []).filter((driver) => {
      if (!driver.license_expiry_date) {
        return false;
      }

      return String(driver.license_expiry_date) >= today;
    });

    const { data: activeTrips, error: tripError } = await supabase
      .from('trips')
      .select('vehicle_id, driver_id')
      .in('status', ACTIVE_TRIP_STATUSES);

    if (tripError) {
      return fail(getErrorMessage(tripError));
    }

    const busyVehicleIds = new Set((activeTrips || []).map((trip) => trip.vehicle_id));
    const busyDriverIds = new Set((activeTrips || []).map((trip) => trip.driver_id));

    const availableVehicles = (vehicles || []).filter(
      (vehicle) => !busyVehicleIds.has(vehicle.id)
    );

    const availableDrivers = assignableDrivers.filter(
      (driver) => !busyDriverIds.has(driver.id)
    );

    return ok(
      {
        vehicles: availableVehicles,
        drivers: availableDrivers,
      },
      'Assignable resources fetched successfully.'
    );
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

module.exports = {
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getAssignableResources,
};
