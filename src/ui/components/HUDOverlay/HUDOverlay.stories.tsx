import type { Meta, StoryObj } from "@storybook/react-vite";

import { HUDOverlay } from ".";

const meta = {
  title: "Screens/HUDOverlay",
  component: HUDOverlay,
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
} satisfies Meta<typeof HUDOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
