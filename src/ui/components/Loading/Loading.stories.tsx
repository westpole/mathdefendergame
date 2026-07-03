import type { Meta, StoryObj } from "@storybook/react-vite";

import "../../../styles.css";

import { Loading } from ".";

const meta = {
  title: "UI/Loading",
  component: Loading,
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
} satisfies Meta<typeof Loading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
