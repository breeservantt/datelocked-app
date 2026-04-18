export function parseSafeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatSafeDate(value, fallback = "") {
  const date = parseSafeDate(value);
  return date ? date.toLocaleString() : fallback;
}