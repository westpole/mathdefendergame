import type { Meta, StoryObj } from '@storybook/react-vite';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';

import { LoginOverlay } from '.';

const meta = {
  title: 'Screens/LoginOverlay',
  component: LoginOverlay,
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
} satisfies Meta<typeof LoginOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
