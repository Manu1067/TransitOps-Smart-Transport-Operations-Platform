<<<<<<< HEAD
const STATUS_STYLES = Object.freeze({
  Available: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  'On Trip': 'bg-sky-100 text-sky-800 ring-sky-600/20',
  'In Shop': 'bg-amber-100 text-amber-800 ring-amber-600/20',
  Retired: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  Suspended: 'bg-rose-100 text-rose-800 ring-rose-600/20',
  Draft: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Dispatched: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20',
  Completed: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  Cancelled: 'bg-rose-100 text-rose-800 ring-rose-600/20',
});

const DEFAULT_STYLE = 'bg-slate-100 text-slate-700 ring-slate-500/20';

export default function StatusBadge({ status }) {
  const label = status ?? 'Unknown';
=======
import {
  DRIVER_STATUSES,
  MAINTENANCE_STATUSES,
  TRIP_STATUSES,
  VEHICLE_STATUSES,
} from '../../utils/constants';

const STATUS_STYLES = {
  [VEHICLE_STATUSES.AVAILABLE]: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  [VEHICLE_STATUSES.ON_TRIP]: 'bg-blue-100 text-blue-800 ring-blue-200',
  [VEHICLE_STATUSES.IN_SHOP]: 'bg-amber-100 text-amber-800 ring-amber-200',
  [VEHICLE_STATUSES.RETIRED]: 'bg-slate-100 text-slate-700 ring-slate-200',
  [DRIVER_STATUSES.OFF_DUTY]: 'bg-slate-100 text-slate-700 ring-slate-200',
  [DRIVER_STATUSES.SUSPENDED]: 'bg-rose-100 text-rose-800 ring-rose-200',
  [TRIP_STATUSES.DRAFT]: 'bg-slate-100 text-slate-700 ring-slate-200',
  [TRIP_STATUSES.DISPATCHED]: 'bg-blue-100 text-blue-800 ring-blue-200',
  [TRIP_STATUSES.COMPLETED]: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  [TRIP_STATUSES.CANCELLED]: 'bg-rose-100 text-rose-800 ring-rose-200',
  [MAINTENANCE_STATUSES.ACTIVE]: 'bg-amber-100 text-amber-800 ring-amber-200',
  [MAINTENANCE_STATUSES.CLOSED]: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
};

const DEFAULT_STYLE = 'bg-indigo-100 text-indigo-800 ring-indigo-200';

export default function StatusBadge({ status, className = '' }) {
  if (!status) {
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${DEFAULT_STYLE} ${className}`}>
        Unknown
      </span>
    );
  }

>>>>>>> f7cae65 (modifying componenets)
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE;

  return (
    <span
<<<<<<< HEAD
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        style,
      ].join(' ')}
    >
      {label}
=======
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style} ${className}`}
    >
      {status}
>>>>>>> f7cae65 (modifying componenets)
    </span>
  );
}
