import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import {
  minimumDesktopStoryFrame,
  minimumMobileStoryFrame,
  popularMobileStoryFrame,
  type StoryFrame,
} from '@ui/components/__mocks__/storyFrames';

import { MenuControls } from '.';

const mobileLandscapeStoryFrame: StoryFrame = {
  width: popularMobileStoryFrame.height,
  height: popularMobileStoryFrame.width,
};

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

export const DesktopOpen: Story = {
  name: 'Desktop menu open (sections)',
  args: {
    frame: minimumDesktopStoryFrame,
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('menu-toggle-button'));
  },
};

export const MobileOpen: Story = {
  name: 'Mobile menu open (sections)',
  args: {
    frame: popularMobileStoryFrame,
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('menu-toggle-button'));
  },
};

export const MobileLandscapeOpen: Story = {
  name: 'Mobile menu open (landscape, scrollable)',
  args: {
    frame: mobileLandscapeStoryFrame,
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('menu-toggle-button'));
  },
};
