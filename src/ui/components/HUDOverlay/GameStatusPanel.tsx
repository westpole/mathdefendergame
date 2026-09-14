import { StatusItem, type StatusItemVariant, type StatusTone } from './StatusItem';

export interface GameStatusPanelItem {
  id: string;
  label: string;
  tone?: StatusTone;
  value: number | string;
  variant: StatusItemVariant;
}

interface GameStatusPanelProps {
  items: ReadonlyArray<GameStatusPanelItem>;
}

export const GameStatusPanel = ({ items }: GameStatusPanelProps) => {
  return (
    <div className="status-panel">
      {items.map((item) => (
        <StatusItem
          key={item.id}
          label={item.label}
          tone={item.tone}
          value={item.value}
          variant={item.variant}
        />
      ))}
    </div>
  );
};
