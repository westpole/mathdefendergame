import type { Meta, StoryObj } from '@storybook/react-vite';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';

import { RulesOverlay } from '.';

const meta = {
  title: 'Screens/RulesOverlay',
  component: RulesOverlay,
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
} satisfies Meta<typeof RulesOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
