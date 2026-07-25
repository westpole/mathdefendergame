import type { Meta, StoryObj } from '@storybook/react-vite';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';

import { CitySceneLayout } from '.';

const meta = {
  title: 'Screens/CitySceneLayout',
  component: CitySceneLayout,
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
} satisfies Meta<typeof CitySceneLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'City scene layout',
};
