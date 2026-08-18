import type { Meta, StoryObj } from '@storybook/react-vite';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';

import { StartMenuControls } from '.';

const meta = {
  title: 'Screens/StartMenuControls',
  component: StartMenuControls,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <GameCanvas>
        <Story />
      </GameCanvas>
    ),
  ],
} satisfies Meta<typeof StartMenuControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
