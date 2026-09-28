import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';
import { useGameStore } from '@store/useGameStore';
import type { StageMessageState, StreakRewardMessageState } from '@store/types';

import wonMock from './__mocks__/won.json';
import lostAnotherLifeMock from './__mocks__/lost-another-life.json';
import { StageMessageOverlay } from '.';

interface StoryArgs {
  initialState: StageMessageState;
  frame?: StoryFrame;
  streakRewardMessage?: StreakRewardMessageState;
}

const wonWithMistakeState: StageMessageState = {
  ...wonMock,
  stageIncorrect: 1,
};

const lostLastLifeState: StageMessageState = {
  ...lostAnotherLifeMock,
  lives: 1,
};

const streakBonusState: StreakRewardMessageState = {
  message: 'Streak x30! +1 life awarded. Keep defending the base.',
};

const meta = {
  title: 'Screens/StageMessageOverlay',
  component: StageMessageOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const { initialState, frame, streakRewardMessage } = context.args as StoryArgs;

      useEffect(() => {
        useGameStore.setState({
          ...baseStoreState,
          phase: 'stage-message',
          stageMessage: initialState,
          streakRewardMessage: streakRewardMessage ?? null,
        });
      }, [initialState, streakRewardMessage]);

      return (
        <GameCanvas height={frame?.height} width={frame?.width}>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof StageMessageOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WonStage: Story = {
  name: 'You won stage (clean)',
  args: {
    initialState: wonMock,
  },
};

export const WonStageWithMistake: Story = {
  name: 'You won stage (with mistake)',
  args: {
    initialState: wonWithMistakeState,
  },
};

export const LostStage: Story = {
  name: 'You lost stage',
  args: {
    initialState: lostAnotherLifeMock,
  },
};

export const LostStageLastLife: Story = {
  name: 'You lost stage (last life)',
  args: {
    initialState: lostLastLifeState,
  },
};

export const MobileLostStageLastLife: Story = {
  name: 'Mobile lost stage (last life)',
  args: {
    frame: popularMobileStoryFrame,
    initialState: lostLastLifeState,
  },
};

export const StreakBonusMessage: Story = {
  name: 'Streak bonus message',
  args: {
    initialState: wonMock,
    streakRewardMessage: streakBonusState,
  },
};

export const MobileStreakBonusMessage: Story = {
  name: 'Mobile streak bonus message',
  args: {
    frame: popularMobileStoryFrame,
    initialState: wonMock,
    streakRewardMessage: streakBonusState,
  },
};
