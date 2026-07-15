function getRowKey(row, index, rowKey) {
  if (typeof rowKey === "function") {
    return rowKey(row, index);
  }

  if (typeof rowKey === "string" && row?.[rowKey] != null) {
    return row[rowKey];
  }

  return index;
}

function renderCell(column, row, rowIndex) {
  if (typeof column.render === "function") {
    return column.render(row, rowIndex);
  }

  if (column.accessor) {
    return row[column.accessor] ?? "—";
  }

  return "—";
}

export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No records found.",
  rowKey = "id",
  className = "",
}) {
  if (loading) {
    return (
      <div
        className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
      >
        <div className="flex items-center justify-center px-6 py-16">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
            aria-label="Loading"
          />
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div
        className={`rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 ${className}`}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key ?? column.accessor ?? column.header}
                  scope="col"
                  className={[
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                    column.className ?? "",
                  ].join(" ")}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row, rowIndex) => {
              const key = getRowKey(row, rowIndex, rowKey);

              return (
                <tr key={key} className="hover:bg-slate-50/80">
                  {columns.map((column) => (
                    <td
                      key={`${key}-${column.key ?? column.accessor ?? column.header}`}
                      className={[
                        "whitespace-nowrap px-4 py-3 text-slate-700",
                        column.cellClassName ?? "",
                      ].join(" ")}
                    >
                      {renderCell(column, row, rowIndex)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}