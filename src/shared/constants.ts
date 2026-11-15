import type { AchievementId, MathOperation } from './types';

/** Every math operation in display order (`+ − × ÷`). Shared by the game core, store, and UI. */
export const MATH_OPERATIONS: MathOperation[] = ['+', '-', '*', '/'];

/** Every saved award id, used to validate persisted profiles. */
export const ACHIEVEMENT_IDS: readonly AchievementId[] = [
  'weekly-streak-bronze',
  'weekly-streak-silver',
  'weekly-streak-gold',
  'weekly-goal-met',
  'personal-best-week',
  'focus-of-the-week',
  'mastery-add',
  'mastery-sub',
  'mastery-mul',
  'mastery-div',
];

/** Award ids that can be earned once per calendar week (deduplicated by id and week key). */
export const WEEKLY_ACHIEVEMENT_IDS: readonly AchievementId[] = [
  'weekly-goal-met',
  'personal-best-week',
  'focus-of-the-week',
];
