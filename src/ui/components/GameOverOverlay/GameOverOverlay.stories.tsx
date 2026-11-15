import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import {
  ScreenView,
  OverlayPhase,
  GameStoreState,
  StageMessageState,
} from '@store/types';
import { useGameStore } from '@store/useGameStore';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import { GameOverOverlay } from '.';
import goalCappedMock from './__mocks__/goalCapped.json';
import goalCountedMock from './__mocks__/goalCounted.json';
import goalLowAccuracyMock from './__mocks__/goalLowAccuracy.json';
import result from './__mocks__/result.json';

const reusableInitialState: Partial<GameStoreState> = {
  phase: 'gameover' as OverlayPhase,
  screenView: 'home' as ScreenView,
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
  frame?: StoryFrame;
}

const meta = {
  title: 'Screens/GameOverOverlay',
  component: GameOverOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const { initialState, frame } = context.args as StoryArgs;

      useEffect(() => {
        useGameStore.setState({
          ...baseStoreState,
          ...initialState,
          profiles: initialState.profiles ?? baseStoreState.profiles,
          gameHistoryByProfile: initialState.gameHistoryByProfile ?? baseStoreState.gameHistoryByProfile,
          stageMessage: initialState.stageMessage ?? baseStoreState.stageMessage,
        });
      }, [initialState]);

      return (
        <GameCanvas height={frame?.height} width={frame?.width}>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof GameOverOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GameOverResults: Story = {
  name: 'Game Over Results',
  args: {
    initialState: {
      ...reusableInitialState,
      ...result,
    },
  },
};

export const MobileGameOverResults: Story = {
  name: 'Mobile game over results',
  args: {
    frame: popularMobileStoryFrame,
    initialState: {
      ...reusableInitialState,
      ...result,
    },
  },
};

export const GoalCounted: Story = {
  name: 'Weekly goal: run counted',
  args: { initialState: goalCountedMock as Partial<GameStoreState> },
};

export const GoalLowAccuracy: Story = {
  name: 'Weekly goal: accuracy too low',
  args: { initialState: goalLowAccuracyMock as Partial<GameStoreState> },
};

export const GoalCapped: Story = {
  name: 'Weekly goal: daily cap reached',
  args: { initialState: goalCappedMock as Partial<GameStoreState> },
};

export const MobileGoalCounted: Story = {
  name: 'Mobile weekly goal: run counted',
  args: { frame: popularMobileStoryFrame, initialState: goalCountedMock as Partial<GameStoreState> },
};

export const MobileGoalLowAccuracy: Story = {
  name: 'Mobile weekly goal: accuracy too low',
  args: { frame: popularMobileStoryFrame, initialState: goalLowAccuracyMock as Partial<GameStoreState> },
};

export const MobileGoalCapped: Story = {
  name: 'Mobile weekly goal: daily cap reached',
  args: { frame: popularMobileStoryFrame, initialState: goalCappedMock as Partial<GameStoreState> },
};
