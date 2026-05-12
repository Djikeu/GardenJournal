/**
 * Single source of truth for short-date formatting across the app.
 * DD/MM/YY — no locale ambiguity.
 */
export function formatDateDMY(input) {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const mon = String(date.getMonth() + 1).padStart(2, '0');
  const yr  = String(date.getFullYear()).slice(-2);
  return `${day}/${mon}/${yr}`;
}

/**
 * Same shape but with the full year — DD/MM/YYYY.
 */
export function formatDateDMYFull(input) {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const mon = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${mon}/${date.getFullYear()}`;
}
