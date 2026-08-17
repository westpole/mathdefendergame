import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import { useGameStore, type GameStoreState } from '@store/useGameStore';

import commanderRexMock from './__mocks__/commanderRex.json';
import generalVossMock from './__mocks__/generalVoss.json';
import { ProfileOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
}

const meta = {
  title: 'Screens/ProfileOverlay',
  component: ProfileOverlay,
  parameters: {
    layout: 'fullscreen',
    initialState: commanderRexMock,
  },
  decorators: [
    (Story, context) => {
      const initialState = (context.parameters as unknown as StoryArgs).initialState;

      useEffect(() => {
        useGameStore.setState((state) => ({
          ...state,
          ...initialState,
          profiles: initialState.profiles ?? state.profiles,
          gameHistoryByProfile: initialState.gameHistoryByProfile ?? state.gameHistoryByProfile,
          leaderboard: initialState.leaderboard ?? state.leaderboard,
        }));
      }, [initialState]);

      return (
        <GameCanvas>
          <section style={{ width: '80%', margin: '3em auto' }}>
            <Story />
          </section>
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof ProfileOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Commander profile',
  parameters: {
    initialState: commanderRexMock,
  },
};

export const MajorGeneral: Story = {
  name: 'Major General profile',
  parameters: {
    initialState: generalVossMock,
  },
};
