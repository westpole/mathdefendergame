import { clsx } from 'clsx';

export type StatusTone = 'good' | 'warn' | 'danger';
export type StatusItemVariant = 'score' | 'stage' | 'shield' | 'lives' | 'streak';

interface StatusItemProps {
  label: string;
  tone?: StatusTone;
  value: number | string;
  variant: StatusItemVariant;
}

const toneClassNames: Record<StatusTone, string> = {
  danger: 'status-item--danger',
  good: 'status-item--good',
  warn: 'status-item--warn',
};

const variantClassNames: Record<StatusItemVariant, string> = {
  lives: 'status-item--lives',
  score: 'status-item--score',
  shield: 'status-item--shield',
  stage: 'status-item--stage',
  streak: 'status-item--streak',
};

/**
 * Renders a single HUD statistic with a label, value, and optional state styling.
 * @param label - Human-readable name for the statistic.
 * @param tone - Optional color emphasis to signal health or urgency.
 * @param value - The metric value to display.
 * @param variant - Visual treatment used for the status tile.
 */
export const StatusItem = ({ label, tone, value, variant }: StatusItemProps) => {
  return (
    <div
      className={clsx('status-item', variantClassNames[variant], tone ? toneClassNames[tone] : undefined)}
    >
      <span className="status-item__label">{label}</span>
      <strong className="status-item__value">{value}</strong>
    </div>
  );
};
