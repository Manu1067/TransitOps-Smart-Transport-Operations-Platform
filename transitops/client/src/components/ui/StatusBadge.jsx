import {
  DRIVER_STATUSES,
  MAINTENANCE_STATUSES,
  TRIP_STATUSES,
  VEHICLE_STATUSES,
} from "../../utils/constants";

const STATUS_STYLES = Object.freeze({
  // Vehicle
  [VEHICLE_STATUSES.AVAILABLE]:
    "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  [VEHICLE_STATUSES.ON_TRIP]:
    "bg-sky-100 text-sky-800 ring-sky-600/20",
  [VEHICLE_STATUSES.IN_SHOP]:
    "bg-amber-100 text-amber-800 ring-amber-600/20",
  [VEHICLE_STATUSES.RETIRED]:
    "bg-slate-100 text-slate-700 ring-slate-500/20",

  // Driver
  [DRIVER_STATUSES.SUSPENDED]:
    "bg-rose-100 text-rose-800 ring-rose-600/20",
  [DRIVER_STATUSES.OFF_DUTY]:
    "bg-slate-100 text-slate-700 ring-slate-500/20",

  // Trip
  [TRIP_STATUSES.DRAFT]:
    "bg-slate-100 text-slate-600 ring-slate-500/20",
  [TRIP_STATUSES.DISPATCHED]:
    "bg-indigo-100 text-indigo-800 ring-indigo-600/20",
  [TRIP_STATUSES.COMPLETED]:
    "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  [TRIP_STATUSES.CANCELLED]:
    "bg-rose-100 text-rose-800 ring-rose-600/20",

  // Maintenance
  [MAINTENANCE_STATUSES.ACTIVE]:
    "bg-amber-100 text-amber-800 ring-amber-600/20",
  [MAINTENANCE_STATUSES.CLOSED]:
    "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
});

const DEFAULT_STYLE =
  "bg-slate-100 text-slate-700 ring-slate-500/20";

export default function StatusBadge({
  status,
  className = "",
}) {
  const label = status ?? "Unknown";
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        style,
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}