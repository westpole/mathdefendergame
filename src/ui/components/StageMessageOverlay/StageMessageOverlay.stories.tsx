import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import { StageMessageState, useGameStore } from '@store/useGameStore';

import wonMock from './__mock__/won.json';
import lostAnotherLifeMock from './__mock__/lost-another-life.json';
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
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const showStageMessage = useGameStore((state) => state.showStageMessage);
      const initialState = (context.args as StoryArgs).initialState;

      useEffect(() => {
        showStageMessage(initialState);
      }, [showStageMessage, initialState]);

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
    initialState: wonMock
  },
};

export const WonStageWithMistake: Story = {
  name: 'You won stage (with mistake)',
  args: {
    initialState: wonWithMistakeState
  },
};

export const LostStage: Story = {
  name: 'You lost stage',
  args: {
    initialState: lostAnotherLifeMock
  },
};

export const LostStageLastLife: Story = {
  name: 'You lost stage (last life)',
  args: {
    initialState: lostLastLifeState
  },
};
