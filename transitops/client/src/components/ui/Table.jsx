<<<<<<< HEAD
function getRowKey(row, index, rowKey) {
  if (typeof rowKey === 'function') {
    return rowKey(row, index);
  }

  if (typeof rowKey === 'string' && row?.[rowKey] != null) {
    return row[rowKey];
  }

  return index;
}

function renderCell(column, row, rowIndex) {
  if (typeof column.render === 'function') {
    return column.render(row, rowIndex);
  }

  if (column.accessor) {
    const value = row[column.accessor];
    return value ?? '—';
  }

  return '—';
}

=======
>>>>>>> f7cae65 (modifying componenets)
export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  rowKey = 'id',
<<<<<<< HEAD
}) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-center px-6 py-16">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
            aria-hidden="true"
          />
          <span className="sr-only">Loading table data</span>
        </div>
=======
  className = '',
}) {
  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-white">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
          aria-label="Loading"
        />
>>>>>>> f7cae65 (modifying componenets)
      </div>
    );
  }

  if (!data.length) {
    return (
<<<<<<< HEAD
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-12 text-center text-sm text-slate-500">{emptyMessage}</div>
=======
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
        {emptyMessage}
>>>>>>> f7cae65 (modifying componenets)
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
=======
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
>>>>>>> f7cae65 (modifying componenets)
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
<<<<<<< HEAD
                  key={column.key ?? column.accessor ?? column.header}
                  scope="col"
                  className={[
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
                    column.className ?? '',
                  ].join(' ')}
=======
                  key={column.key}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
>>>>>>> f7cae65 (modifying componenets)
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
<<<<<<< HEAD
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row, rowIndex) => (
              <tr key={getRowKey(row, rowIndex, rowKey)} className="hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td
                    key={`${getRowKey(row, rowIndex, rowKey)}-${column.key ?? column.accessor ?? column.header}`}
                    className={[
                      'whitespace-nowrap px-4 py-3 text-sm text-slate-700',
                      column.cellClassName ?? '',
                    ].join(' ')}
                  >
                    {renderCell(column, row, rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
=======
          <tbody className="divide-y divide-slate-100">
            {data.map((row, index) => {
              const key = row[rowKey] ?? index;

              return (
                <tr key={key} className="hover:bg-slate-50/80">
                  {columns.map((column) => (
                    <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
>>>>>>> f7cae65 (modifying componenets)
          </tbody>
        </table>
      </div>
    </div>
  );
}
