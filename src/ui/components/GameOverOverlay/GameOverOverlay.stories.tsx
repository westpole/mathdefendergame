import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";

import {
  MenuView,
  OverlayPhase,
  useGameStore,
  GameStoreState,
  StageMessageState,
} from "../../../store/useGameStore";

import { GameOverOverlay } from ".";
import childMock from "./__mocks__/child.json";
import studentMock from "./__mocks__/student.json";
import adultMock from "./__mocks__/adult.json";

const reusableInitialState: Partial<GameStoreState> = {
  phase: 'gameover' as OverlayPhase,
  menuView: 'home' as MenuView,
  bootReady: false,
  stageMessage: {
    success: false,
    stage: 3,
    score: 33,
    lives: 0,
    stageIncorrect: 0,
  } as StageMessageState,
};

interface StoryArgs {
  initialState: Partial<GameStoreState>;
}

const meta = {
  title: 'Screens/GameOverOverlay',
  component: GameOverOverlay,
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
} satisfies Meta<typeof GameOverOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Child: Story = {
  name: 'Child Level',
  args: {
    initialState: {
      ...reusableInitialState,
      ...childMock,
    }
  },
};

export const Student: Story = {
  name: 'Student Level',
  args: {
    initialState: {
      ...reusableInitialState,
      ...studentMock,
    }
  },
};

export const Adult: Story = {
  name: 'Adult Level',
  args: {
    initialState: {
      ...reusableInitialState,
      ...adultMock,
    }
  },
};
