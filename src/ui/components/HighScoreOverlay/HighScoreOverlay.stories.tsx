import type { Meta, StoryObj } from "@storybook/react-vite";

import { HighScoreOverlay } from ".";

const meta = {
  title: "Screens/HighScoreOverlay",
  component: HighScoreOverlay,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => <Story />,
  ],
} satisfies Meta<typeof HighScoreOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Empty',
};
