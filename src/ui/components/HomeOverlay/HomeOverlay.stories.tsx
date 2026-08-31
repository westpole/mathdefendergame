import type { Meta, StoryObj } from '@storybook/react-vite';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';

import { HomeOverlay } from '.';

const meta = {
  title: 'Screens/HomeOverlay',
  component: HomeOverlay,
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
} satisfies Meta<typeof HomeOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
