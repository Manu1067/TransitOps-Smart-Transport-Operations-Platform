/**
 * Reusable filter bar for list and dashboard views.
 *
 * @param {object} props
 * @param {Array<{ key: string, label: string, type: 'select' | 'search', options?: Array<{ value: string, label: string }>, placeholder?: string }>} props.definitions
 * @param {Record<string, string>} props.values
 * @param {(key: string, value: string) => void} props.onChange
 * @param {string} [props.className]
 */
export default function FilterBar({ definitions = [], values = {}, onChange, className = '' }) {
  return (
    <div
      className={[
        'flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end',
        className,
      ].join(' ')}
    >
      {definitions.map((definition) => {
        const value = values[definition.key] ?? '';

        if (definition.type === 'search') {
          return (
            <label key={definition.key} className="flex min-w-[200px] flex-1 flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {definition.label}
              </span>
              <input
                type="search"
                value={value}
                placeholder={definition.placeholder ?? 'Search…'}
                onChange={(event) => onChange(definition.key, event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2"
              />
            </label>
          );
        }

        return (
          <label key={definition.key} className="flex min-w-[160px] flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {definition.label}
            </span>
            <select
              value={value}
              onChange={(event) => onChange(definition.key, event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
            >
              <option value="">All</option>
              {(definition.options ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        );
      })}
    </div>
  );
}
