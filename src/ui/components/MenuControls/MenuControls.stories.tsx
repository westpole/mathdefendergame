import type { Meta, StoryObj } from '@storybook/react-vite';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';

import { MenuControls } from '.';

const meta = {
  title: 'Screens/MenuControls',
  component: MenuControls,
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
} satisfies Meta<typeof MenuControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
