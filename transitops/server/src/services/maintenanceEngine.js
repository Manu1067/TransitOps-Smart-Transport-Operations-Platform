const supabase = require('../supabaseClient');
const {
  VEHICLE_STATUSES,
  ensureNonNegativeNumber,
  ensureRequiredFields,
} = require('../utils/validators');

const MAINTENANCE_STATUSES = Object.freeze({
  ACTIVE: 'Active',
  CLOSED: 'Closed',
});

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
 * @param {string} logId
 * @returns {Promise<{ success: true, data: Record<string, unknown> } | { success: false, message: string }>}
 */
async function fetchMaintenanceLogById(logId) {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .select('*')
    .eq('id', logId)
    .maybeSingle();

  if (error) {
    return fail(getErrorMessage(error));
  }

  if (!data) {
    return fail(`Maintenance log not found for id "${logId}".`);
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
 * @param {string} vehicleId
 * @param {string} [excludeLogId]
 */
async function ensureNoActiveMaintenanceForVehicle(vehicleId, excludeLogId) {
  let query = supabase
    .from('maintenance_logs')
    .select('id, title, started_at')
    .eq('vehicle_id', vehicleId)
    .eq('status', MAINTENANCE_STATUSES.ACTIVE);

  if (excludeLogId) {
    query = query.neq('id', excludeLogId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  if (data) {
    throw new Error(
      `Vehicle already has an active maintenance log (${data.id}: ${data.title}). Close it before opening another.`
    );
  }
}

/**
 * @param {Record<string, unknown>} vehicle
 */
function ensureVehicleEligibleForMaintenance(vehicle) {
  const vehicleLabel = vehicle.registration_number || 'Vehicle';

  if (vehicle.status === VEHICLE_STATUSES.ON_TRIP) {
    throw new Error(
      `${vehicleLabel} is currently On Trip and cannot be placed into active maintenance.`
    );
  }
}

/**
 * @param {Record<string, unknown>} log
 */
function ensureMaintenanceLogIsActive(log) {
  if (!log || typeof log !== 'object') {
    throw new Error('A valid maintenance log record is required.');
  }

  if (log.status !== MAINTENANCE_STATUSES.ACTIVE) {
    throw new Error(
      `Maintenance log must be Active to perform this action (current status: "${log.status ?? 'unknown'}").`
    );
  }
}

/**
 * @param {Record<string, unknown>} vehicle
 * @returns {string}
 */
function resolveVehicleStatusAfterMaintenanceClose(vehicle) {
  if (vehicle.status === VEHICLE_STATUSES.RETIRED) {
    return VEHICLE_STATUSES.RETIRED;
  }

  return VEHICLE_STATUSES.AVAILABLE;
}

/**
 * @param {Record<string, unknown>} vehicle
 * @returns {string|null}
 */
function resolveVehicleStatusOnMaintenanceCreate(vehicle) {
  if (vehicle.status === VEHICLE_STATUSES.RETIRED) {
    return null;
  }

  return VEHICLE_STATUSES.IN_SHOP;
}

/**
 * Create an Active maintenance log and move the vehicle to In Shop when applicable.
 *
 * @param {Record<string, unknown>} payload
 */
async function createMaintenanceLog(payload) {
  try {
    ensureRequiredFields(payload, ['vehicle_id', 'title']);

    const vehicleResult = await fetchVehicleById(String(payload.vehicle_id));
    if (!vehicleResult.success) {
      return fail(vehicleResult.message);
    }

    const vehicle = vehicleResult.data;

    ensureVehicleEligibleForMaintenance(vehicle);
    await ensureNoActiveMaintenanceForVehicle(String(payload.vehicle_id));

    if (payload.odometer_at_service != null && payload.odometer_at_service !== '') {
      ensureNonNegativeNumber(payload.odometer_at_service, 'Odometer at service');
    }

    if (payload.cost != null && payload.cost !== '') {
      ensureNonNegativeNumber(payload.cost, 'Cost');
    }

    const insertPayload = {
      vehicle_id: payload.vehicle_id,
      title: String(payload.title).trim(),
      description: payload.description ?? null,
      status: MAINTENANCE_STATUSES.ACTIVE,
      odometer_at_service: payload.odometer_at_service ?? null,
      cost: payload.cost ?? null,
      started_at: payload.started_at ?? new Date().toISOString(),
    };

    const { data: maintenanceLog, error: insertError } = await supabase
      .from('maintenance_logs')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) {
      return fail(getErrorMessage(insertError));
    }

    const nextVehicleStatus = resolveVehicleStatusOnMaintenanceCreate(vehicle);

    if (nextVehicleStatus) {
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: nextVehicleStatus })
        .eq('id', vehicle.id)
        .neq('status', VEHICLE_STATUSES.ON_TRIP);

      if (vehicleError) {
        await supabase
          .from('maintenance_logs')
          .delete()
          .eq('id', maintenanceLog.id);

        return fail(getErrorMessage(vehicleError));
      }
    }

    return ok(maintenanceLog, 'Maintenance log created successfully.');
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

/**
 * Close an Active maintenance log and restore vehicle availability when allowed.
 *
 * @param {string} logId
 * @param {Record<string, unknown>} [closingData={}]
 */
async function closeMaintenanceLog(logId, closingData = {}) {
  try {
    const logResult = await fetchMaintenanceLogById(logId);
    if (!logResult.success) {
      return fail(logResult.message);
    }

    const log = logResult.data;
    ensureMaintenanceLogIsActive(log);

    const vehicleResult = await fetchVehicleById(String(log.vehicle_id));
    if (!vehicleResult.success) {
      return fail(vehicleResult.message);
    }

    const vehicle = vehicleResult.data;

    const logUpdate = {
      status: MAINTENANCE_STATUSES.CLOSED,
      closed_at: new Date().toISOString(),
    };

    if (closingData.description != null && closingData.description !== '') {
      logUpdate.description = String(closingData.description).trim();
    }

    if (closingData.odometer_at_service != null && closingData.odometer_at_service !== '') {
      logUpdate.odometer_at_service = ensureNonNegativeNumber(
        closingData.odometer_at_service,
        'Odometer at service'
      );
    }

    if (closingData.cost != null && closingData.cost !== '') {
      logUpdate.cost = ensureNonNegativeNumber(closingData.cost, 'Cost');
    }

    const { data: updatedLog, error: logError } = await supabase
      .from('maintenance_logs')
      .update(logUpdate)
      .eq('id', logId)
      .eq('status', MAINTENANCE_STATUSES.ACTIVE)
      .select('*')
      .maybeSingle();

    if (logError) {
      return fail(getErrorMessage(logError));
    }

    if (!updatedLog) {
      return fail('Maintenance log could not be closed because it is no longer Active.');
    }

    const nextVehicleStatus = resolveVehicleStatusAfterMaintenanceClose(vehicle);

    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ status: nextVehicleStatus })
      .eq('id', vehicle.id);

    if (vehicleError) {
      await supabase
        .from('maintenance_logs')
        .update({
          status: MAINTENANCE_STATUSES.ACTIVE,
          closed_at: null,
        })
        .eq('id', logId);

      return fail(getErrorMessage(vehicleError));
    }

    return ok(
      {
        maintenanceLog: updatedLog,
        vehicleStatus: nextVehicleStatus,
      },
      'Maintenance log closed successfully.'
    );
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

/**
 * Fetch all Active maintenance logs with linked vehicle details.
 */
async function getActiveMaintenanceLogs() {
  try {
    const { data, error } = await supabase
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
      .eq('status', MAINTENANCE_STATUSES.ACTIVE)
      .order('started_at', { ascending: false });

    if (error) {
      return fail(getErrorMessage(error));
    }

    return ok(data || [], 'Active maintenance logs fetched successfully.');
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}

module.exports = {
  createMaintenanceLog,
  closeMaintenanceLog,
  getActiveMaintenanceLogs,
};