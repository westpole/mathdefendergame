import type { Grade } from '@shared/types';

/**
 * Converts a grade string (e.g., 'major-general') into a human-readable title case string (e.g., 'Major General').
 * @param grade The grade to convert to a title case string.
 * @returns The title case string representation of the grade.
 */
export function toGradeTitle(grade: Grade): string {
  return grade
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Formats a numeric score value into a localized string representation.
 * @param value The numeric score to format.
 * @returns The formatted score as a string.
 */
export function formatScore(value: number): string {
  return value.toLocaleString();
}

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
