import type { Meta, StoryObj } from "@storybook/react-vite";

import { HUDOverlay } from ".";

// add mock for game start scenario

const meta = {
  title: "Screens/HUDOverlay",
  component: HUDOverlay,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      return <Story />;
    },
  ],
} satisfies Meta<typeof HUDOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'HUD overlay on start',
};
