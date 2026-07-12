/**
 * Escape a value for CSV output.
 *
 * @param {unknown} value
 * @returns {string}
 */
function escapeCsvValue(value) {
  if (value == null) {
    return '';
  }

  const stringValue = String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert an array of row objects into a CSV string.
 *
 * @param {Array<Record<string, unknown>>} rows
 * @param {string[]} [columns]
 * @returns {string}
 */
function generateCsv(rows, columns) {
  const safeRows = rows || [];

  if (safeRows.length === 0) {
    return '';
  }

  const headers = columns || Object.keys(safeRows[0]);
  const headerLine = headers.map(escapeCsvValue).join(',');
  const dataLines = safeRows.map((row) =>
    headers.map((column) => escapeCsvValue(row[column])).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Set HTTP headers for a CSV file download.
 *
 * @param {import('express').Response} res
 * @param {string} filename
 */
function setDownloadHeaders(res, filename) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}

module.exports = {
  generateCsv,
  setDownloadHeaders,
  escapeCsvValue,
};
