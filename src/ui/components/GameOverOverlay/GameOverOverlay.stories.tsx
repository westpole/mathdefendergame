import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";

import {
  MenuView,
  OverlayPhase,
  useGameStore,
  GameStoreState,
  StageMessageState,
} from "../../../store/useGameStore";
import { Difficulty } from "../../../types";

import { GameOverOverlay } from ".";

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
      difficulty: 'child' as Difficulty,
      score: 33,
      lives: 0,
      shield: 5,
      stage: 3,
      stageScore: 125,
      correctCount: 16,
      incorrectCount: 4,
      finalPerfScore: 75,
      leaderboard: {
        child: [{ name: 'Child player', score: 33 }],
        student: [],
        adult: [],
      },
    }
  },
};

export const Student: Story = {
  name: 'Student Level',
  args: {
    initialState: {
      ...reusableInitialState,
      difficulty: 'student' as Difficulty,
      score: 33,
      lives: 0,
      shield: 5,
      stage: 3,
      stageScore: 125,
      correctCount: 16,
      incorrectCount: 4,
      finalPerfScore: 75,
      leaderboard: {
        child: [],
        student: [{ name: 'Student player', score: 33 }],
        adult: [],
      },
    }
  },
};

export const Adult: Story = {
  name: 'Adult Level',
  args: {
    initialState: {
      ...reusableInitialState,
      difficulty: 'adult' as Difficulty,
      score: 33,
      lives: 0,
      shield: 5,
      stage: 3,
      stageScore: 125,
      correctCount: 16,
      incorrectCount: 4,
      finalPerfScore: 75,
      leaderboard: {
        child: [],
        student: [],
        adult: [{ name: 'Adult player', score: 33 }],
      },
    }
  },
};
