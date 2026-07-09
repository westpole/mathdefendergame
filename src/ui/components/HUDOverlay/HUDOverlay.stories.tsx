import type { Meta, StoryObj } from "@storybook/react-vite";
import { useGameStore } from "../../../store/useGameStore";
import { HUDOverlay } from ".";

import startGameMock from './__mocks__/start.json';
import inProgressGameMock from './__mocks__/inProgress.json';
import { useEffect } from "react";

interface StoryArgs {
  initialState: Record<string, unknown>;
}

const meta = {
  title: "Screens/HUDOverlay",
  component: HUDOverlay,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story, context) => {
      const syncHUD = useGameStore((state) => state.syncHUD);

      useEffect(() => {
        syncHUD((context.args as StoryArgs).initialState);
      }, [syncHUD, (context.args as StoryArgs)?.initialState]);

      return <Story />;
    },
  ],
} satisfies Meta<typeof HUDOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

// @todo: revisit count of lives and shield blocks to ensure they are consistent with the game config and the mock data.
// How to deal with extra lives?
// 10 lives each stage that will be reduced by incorrect answer.
// 5 shields each stage that will be reduced by meteor hiting the base.
// if player has 0 lives, game over.
// If player has 0 shields, base is destroyed and game over.

export const Default: Story = {
  name: 'HUD overlay on start',
  args: {
    initialState: startGameMock,
  },
};

export const inProgress: Story = {
  name: 'HUD overlay in progress',
  args: {
    initialState: inProgressGameMock,
  },
};
