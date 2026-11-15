import type { MathOperation } from '@shared/types';
import type { SelectOption } from '@ui/components/Select';

/** i18n key for each math operation's display name. */
export const OPERATION_I18N_KEYS: Record<MathOperation, string> = {
  '+': 'performance.operation.addition',
  '-': 'performance.operation.subtraction',
  '*': 'performance.operation.multiplication',
  '/': 'performance.operation.division',
};

/** Languages offered by the language pickers; labels are endonyms and stay untranslated. */
export const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'uk', label: 'Українська' },
];
