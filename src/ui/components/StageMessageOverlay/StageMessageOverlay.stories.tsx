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
  name: 'You won stage',
  args: {
    initialState: wonMock
  },
};

export const LostAnotherLifeStage: Story = {
  name: 'You lost another life',
  args: {
    initialState: lostAnotherLifeMock
  },
};
