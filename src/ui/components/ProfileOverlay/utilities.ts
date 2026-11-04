/**
 * Formats a numeric answers per minute (APM) value into a localized string representation with one decimal place.
 * @param value The APM value to format.
 * @returns The formatted APM as a string.
 */
export function formatApm(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
