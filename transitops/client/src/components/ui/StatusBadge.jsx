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
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE;

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        style,
      ].join(' ')}
    >
      {label}
    </span>
  );
}
