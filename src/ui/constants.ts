import type { MathOperation } from '@shared/types';

/** i18n key for each math operation's display name. */
export const OPERATION_I18N_KEYS: Record<MathOperation, string> = {
  '+': 'performance.operation.addition',
  '-': 'performance.operation.subtraction',
  '*': 'performance.operation.multiplication',
  '/': 'performance.operation.division',
};
