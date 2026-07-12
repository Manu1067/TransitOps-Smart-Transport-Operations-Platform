export default function KpiCard({ title, value, icon, subtitle }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value ?? '—'}
          </p>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>

        {icon ? (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-lg text-indigo-600"
            aria-hidden="true"
          >
            {icon}
          </div>
        ) : null}
      </div>
    </article>
  );
}
