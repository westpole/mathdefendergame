/**
 * Formats a decimal accuracy value into a user-facing percentage string.
 *
 * @param value - Accuracy expressed as a ratio from 0 to 1 or a percentage-like number.
 * @returns A rounded percentage string such as 92%.
 */
export function formatAccuracy(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Formats a speed value into a compact seconds display for the performance table.
 *
 * @param value - Average time in seconds.
 * @returns A value formatted to one decimal place with a trailing "s" suffix.
 */
export function formatSpeed(value: number): string {
  return `${value.toFixed(1)}s`;
}
