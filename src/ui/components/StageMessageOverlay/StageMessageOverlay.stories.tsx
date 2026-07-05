import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";

import { useGameStore } from "../../../store/useGameStore";
import { StageMessageOverlay } from ".";

const meta = {
  title: "Screens/StageMessageOverlay",
  component: StageMessageOverlay,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      const showStageMessage = useGameStore((state) => state.showStageMessage);

      useEffect(() => {
        showStageMessage({
          stage: 1,
          score: 1000,
          lives: 3,
          success: true,
          stageIncorrect: 0,
        });
      }, [showStageMessage]);

      return (
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
      );
    },
  ],
} satisfies Meta<typeof StageMessageOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
