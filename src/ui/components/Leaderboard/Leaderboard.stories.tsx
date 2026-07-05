import type { Meta, StoryObj } from "@storybook/react-vite";

import { Leaderboard } from ".";

const meta = {
  title: "Screens/Leaderboard",
  component: Leaderboard,
  args: {
    initialDifficulty: "student",
    limit: 5,
  },
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #1e293b 0%, #020617 55%, #000000 100%)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Leaderboard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
