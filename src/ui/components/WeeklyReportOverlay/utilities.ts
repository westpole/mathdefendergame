/**
 * Formats a numeric score using the current locale's thousands separators.
 *
 * @param value - The score to format.
 * @returns The formatted score as a localized string.
 */
export function formatScore(value: number): string {
  return value.toLocaleString();
}

/**
 * Converts a numeric accuracy value into a percentage label.
 *
 * @param value - The accuracy percentage before rounding, such as 96.7.
 * @returns The rounded percentage string, including the percent sign.
 */
export function formatAccuracy(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Formats a Unix timestamp as a short month/day date label.
 *
 * @param value - The timestamp in milliseconds.
 * @returns A compact date string such as "Oct 1".
 */
export function formatShortDate(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(value);
}
