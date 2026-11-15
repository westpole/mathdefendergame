import type { Grade } from '@shared/types';

/**
 * Converts a grade key into a readable title. Used as the i18n fallback for grade names.
 *
 * @param grade - The grade identifier, such as 'major-general'.
 * @returns The grade in title case with spaces between parts.
 * @example
 * toGradeTitle('major-general'); // 'Major General'
 */
export function toGradeTitle(grade: Grade): string {
  return grade
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Rounds a goal percent for display without ever showing 100% before the goal is met.
 *
 * @param percent - Credited share of the goal, 0–100 (100 only when met).
 * @returns A whole percent: 100 when met, otherwise at most 99.
 */
export function toDisplayGoalPercent(percent: number): number {
  return percent >= 100 ? 100 : Math.min(99, Math.floor(percent));
}
