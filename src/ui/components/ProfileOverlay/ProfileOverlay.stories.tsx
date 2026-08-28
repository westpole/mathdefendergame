import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore, type GameStoreState } from '@store/useGameStore';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';

import commanderRexMock from './__mocks__/commanderRex.json';
import generalVossMock from './__mocks__/generalVoss.json';
import { ProfileOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
}

const meta = {
  title: 'Screens/ProfileOverlay',
  component: ProfileOverlay,
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
          ...initialState,
          profiles: initialState.profiles ?? baseStoreState.profiles,
          gameHistoryByProfile: initialState.gameHistoryByProfile ?? baseStoreState.gameHistoryByProfile,
          leaderboard: initialState.leaderboard ?? baseStoreState.leaderboard,
        });
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
  args: {
    initialState: commanderRexMock,
  },
};

export const MajorGeneral: Story = {
  name: 'Major General profile',
  args: {
    initialState: generalVossMock,
  },
};
