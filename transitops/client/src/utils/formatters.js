const DEFAULT_LOCALE = 'en-IN';
const DEFAULT_CURRENCY = 'INR';

/**
 * @param {string | Date | null | undefined} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDate(value, options = {}) {
  if (value == null || value === '') {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(date);
}

/**
 * @param {string | Date | null | undefined} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDateTime(value, options = {}) {
  if (value == null || value === '') {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(date);
}

/**
 * @param {number | string | null | undefined} value
 * @param {string} [currency]
 * @param {Intl.NumberFormatOptions} [options]
 * @returns {string}
 */
export function formatCurrency(value, currency = DEFAULT_CURRENCY, options = {}) {
  if (value == null || value === '') {
    return '—';
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return '—';
  }

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * @param {number | string | null | undefined} value
 * @param {Intl.NumberFormatOptions} [options]
 * @returns {string}
 */
export function formatNumber(value, options = {}) {
  if (value == null || value === '') {
    return '—';
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return '—';
  }

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * @param {number | string | null | undefined} value
 * @param {Intl.NumberFormatOptions} [options]
 * @returns {string}
 */
export function formatPercentage(value, options = {}) {
  if (value == null || value === '') {
    return '—';
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return '—';
  }

  const normalized = Math.abs(amount) > 1 ? amount / 100 : amount;

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'percent',
    maximumFractionDigits: 1,
    ...options,
  }).format(normalized);
}
