import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { StageMessageState, useGameStore } from '@store/useGameStore';

import wonMock from './__mocks__/won.json';
import lostAnotherLifeMock from './__mocks__/lost-another-life.json';
import { StageMessageOverlay } from '.';

interface StoryArgs {
  initialState: StageMessageState;
}

const wonWithMistakeState: StageMessageState = {
  ...wonMock,
  stageIncorrect: 1,
};

const lostLastLifeState: StageMessageState = {
  ...lostAnotherLifeMock,
  lives: 1,
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
      const { initialState } = context.args as StoryArgs;

      useEffect(() => {
        useGameStore.setState({
          ...baseStoreState,
          phase: 'stage-message',
          stageMessage: initialState,
        });
      }, [initialState]);

      return (
        <GameCanvas>
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
