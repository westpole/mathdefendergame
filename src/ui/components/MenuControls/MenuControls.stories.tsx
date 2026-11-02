import type { Meta, StoryObj } from '@storybook/react-vite';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import {
  minimumDesktopStoryFrame,
  minimumMobileStoryFrame,
  popularMobileStoryFrame,
  type StoryFrame,
} from '@ui/components/__mocks__/storyFrames';

import { MenuControls } from '.';

interface StoryArgs {
  frame?: StoryFrame;
}

const meta = {
  title: 'Screens/MenuControls',
  component: MenuControls,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const { frame } = context.args as StoryArgs;

      return (
        <GameCanvas width={frame?.width} height={frame?.height}>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof MenuControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Desktop: Story = {
  name: 'Desktop menu with title',
  args: {
    frame: minimumDesktopStoryFrame,
  },
};

export const Mobile: Story = {
  name: 'Mobile menu with title',
  args: {
    frame: popularMobileStoryFrame,
  },
};

export const MobileMinimum: Story = {
  name: 'Minimum mobile menu with title',
  args: {
    frame: minimumMobileStoryFrame,
  },
};
