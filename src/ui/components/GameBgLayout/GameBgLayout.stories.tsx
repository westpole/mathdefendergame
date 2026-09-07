import type { Meta, StoryObj } from '@storybook/react-vite';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';

import { GameBgLayout } from '.';

const meta = {
  title: 'Screens/GameBgLayout',
  component: GameBgLayout,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      return (
        <GameCanvas>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof GameBgLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Game background layout',
};
