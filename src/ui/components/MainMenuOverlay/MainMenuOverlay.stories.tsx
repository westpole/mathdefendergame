import type { Meta, StoryObj } from "@storybook/react-vite";

import GameCanvas from "../__mocks__/GameCanvas";
import { MainMenuOverlay } from ".";

const meta = {
  title: "Screens/MainMenuOverlay",
  component: MainMenuOverlay,
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
} satisfies Meta<typeof MainMenuOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
