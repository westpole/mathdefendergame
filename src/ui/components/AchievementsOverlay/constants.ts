/** Weekday i18n keys, Monday first, matching `buildWeekDays`. */
export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** Relentless tier names in `STREAK_TIERS` order, used for i18n keys and CSS modifiers. */
export const RELENTLESS_TIER_NAMES = ['bronze', 'silver', 'gold'] as const;

/** Display symbols for the mastery tiles. */
export const OPERATION_SYMBOLS = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
} as const;
