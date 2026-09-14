import type { Meta, StoryObj } from '@storybook/react-vite';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import {
  maximumMobileStoryFrame,
  minimumDesktopStoryFrame,
  minimumMobileStoryFrame,
  type StoryFrame,
} from '@ui/components/__mocks__/storyFrames';

import { GameBgLayout } from '.';

interface StoryArgs {
  frame?: StoryFrame;
}

const meta = {
  title: 'Screens/GameBgLayout',
  component: GameBgLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story, context) => {
      const { frame = minimumDesktopStoryFrame } = context.args as StoryArgs;

      return (
        <GameCanvas width={frame.width} height={frame.height}>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof GameBgLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  name: 'Desktop background layout',
  args: {
    frame: minimumDesktopStoryFrame,
  },
};

export const MobileMinimum: Story = {
  name: 'Minimum mobile background layout',
  args: {
    frame: minimumMobileStoryFrame,
  },
};

export const MobileMaximum: Story = {
  name: 'Maximum mobile background layout',
  args: {
    frame: maximumMobileStoryFrame,
  },
};
