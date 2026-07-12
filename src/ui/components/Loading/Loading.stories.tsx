import type { Meta, StoryObj } from "@storybook/react-vite";

import GameCanvas from "../__mocks__/GameCanvas";
import { Loading } from ".";

const meta = {
  title: "Screens/Loading",
  component: Loading,
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
} satisfies Meta<typeof Loading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
