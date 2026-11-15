import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  minimumDesktopStoryFrame,
  popularMobileStoryFrame,
  type StoryFrame,
} from '@ui/components/__mocks__/storyFrames';

import { Select, type SelectOption } from '.';

/** Component props plus the device frame used to size the surrounding panel. */
type SelectStoryArgs = ComponentProps<typeof Select> & {
  frame?: StoryFrame;
};

const pilotOptions: SelectOption[] = [
  { value: 'AcePilot', label: 'AcePilot' },
  { value: 'CommanderRex', label: 'CommanderRex' },
  { value: 'StarCadet', label: 'StarCadet' },
];

const manyOptions: SelectOption[] = Array.from({ length: 12 }, (_, index) => ({
  value: `pilot-${index + 1}`,
  label: `Pilot ${index + 1}`,
}));

/** Stateful wrapper so selecting an option updates the displayed value in Storybook. */
function ControlledSelect({ value: initialValue, onChange, ...props }: ComponentProps<typeof Select>) {
  const [value, setValue] = useState(initialValue);

  return (
    <Select
      {...props}
      onChange={(nextValue) => {
        setValue(nextValue);
        onChange(nextValue);
      }}
      value={value}
    />
  );
}

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    id: 'story-select',
    labelId: 'story-select-label',
    options: pilotOptions,
    value: '',
    placeholder: 'Select profile',
    onChange: () => undefined,
  },
  render: ({ frame: _frame, ...args }) => <ControlledSelect {...args} />,
  decorators: [
    (Story, context) => {
      const { frame = minimumDesktopStoryFrame, labelId } = context.args;

      // Panel width matches the overlay panels the select is rendered in (16px side gutter).
      return (
        <div className="overlay-panel login-panel" style={{ width: `${frame.width - 32}px`, minHeight: '320px' }}>
          <div className="login-form">
            <label className="field-label" id={labelId}>Username</label>
            <Story />
          </div>
        </div>
      );
    },
  ],
} satisfies Meta<SelectStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {
  name: 'Empty with placeholder',
};

export const Selected: Story = {
  name: 'Value selected',
  args: { value: 'CommanderRex' },
};

export const ManyOptions: Story = {
  name: 'Many options (scrollable list)',
  args: { options: manyOptions, value: 'pilot-9' },
};

export const NoOptions: Story = {
  name: 'No options',
  args: { options: [] },
};

export const MobilePlaceholder: Story = {
  name: 'Mobile empty with placeholder',
  args: { frame: popularMobileStoryFrame },
};

export const MobileSelected: Story = {
  name: 'Mobile value selected',
  args: { value: 'CommanderRex', frame: popularMobileStoryFrame },
};

export const MobileManyOptions: Story = {
  name: 'Mobile many options (scrollable list)',
  args: { options: manyOptions, value: 'pilot-9', frame: popularMobileStoryFrame },
};
