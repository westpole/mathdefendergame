import type { Meta, StoryObj } from "@storybook/react-vite";

import GameCanvas from "../__mocks__/GameCanvas";
import { HighScoreOverlay } from ".";

const meta = {
  title: "Screens/HighScoreOverlay",
  component: HighScoreOverlay,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <GameCanvas>
        <Story />
      </GameCanvas>
    ),
  ],
} satisfies Meta<typeof HighScoreOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default',
};
