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
