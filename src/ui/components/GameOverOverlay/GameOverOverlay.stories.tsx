import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import {
  MenuView,
  OverlayPhase,
  useGameStore,
  GameStoreState,
  StageMessageState,
} from '@store/useGameStore';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';

import { GameOverOverlay } from '.';
import traineeMock from './__mocks__/child.json';
import commanderMock from './__mocks__/student.json';
import majorGeneralMock from './__mocks__/adult.json';

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
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const syncHUD = useGameStore((state) => state.syncHUD);
      const initialState = (context.args as StoryArgs).initialState;

      useEffect(() => {
        syncHUD(initialState);
      }, [syncHUD, initialState]);

      return (
        <GameCanvas>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof GameOverOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Child: Story = {
  name: 'Trainee',
  args: {
    initialState: {
      ...reusableInitialState,
      ...traineeMock,
    }
  },
};

export const Student: Story = {
  name: 'Commander',
  args: {
    initialState: {
      ...reusableInitialState,
      ...commanderMock,
    }
  },
};

export const Adult: Story = {
  name: 'Major General',
  args: {
    initialState: {
      ...reusableInitialState,
      ...majorGeneralMock,
    }
  },
};
