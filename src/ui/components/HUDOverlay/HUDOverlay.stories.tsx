import type { Meta, StoryObj } from "@storybook/react-vite";
import { useGameStore } from "../../../store/useGameStore";
import { HUDOverlay } from ".";

import startGameMock from './__mocks__/start.json';
import inProgressGameMock from './__mocks__/inProgress.json';
import GameCanvas from "../__mocks__/GameCanvas";
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

      return (
        <GameCanvas>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof HUDOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

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
