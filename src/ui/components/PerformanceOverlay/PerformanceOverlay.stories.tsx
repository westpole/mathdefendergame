import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore, type GameStoreState } from '@store/useGameStore';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';

import commanderRexMock from '../ProfileOverlay/__mocks__/commanderRex.json';
import { PerformanceOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
}

const meta = {
  title: 'Screens/PerformanceOverlay',
  component: PerformanceOverlay,
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
} satisfies Meta<typeof PerformanceOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialState: {
      ...commanderRexMock,
      menuView: 'performance',
      phase: 'start',
    },
  },
};
