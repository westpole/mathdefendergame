import type { Meta, StoryObj } from "@storybook/react-vite";
import { CitySceneLayout } from ".";

import GameCanvas from "../__mocks__/GameCanvas";

const meta = {
  title: "Screens/CitySceneLayout",
  component: CitySceneLayout,
  parameters: {
    layout: "fullscreen",
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
