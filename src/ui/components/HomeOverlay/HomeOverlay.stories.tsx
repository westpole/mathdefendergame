import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore, type GameStoreState } from '@store/useGameStore';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';

import emptyWeekMock from './__mocks__/empty-week.json';
import weeklyProgressMock from './__mocks__/weekly-progress.json';
import { HomeOverlay } from '.';

const STORY_NOW = Date.UTC(2026, 7, 31, 12, 0, 0);

interface StoryArgs {
  initialState: Partial<GameStoreState>;
}

const meta = {
  title: 'Screens/HomeOverlay',
  component: HomeOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const { initialState } = context.args as StoryArgs;

      useEffect(() => {
        const originalDateNow = Date.now;

        Date.now = () => STORY_NOW;
        useGameStore.setState({
          ...baseStoreState,
          ...initialState,
          profiles: initialState.profiles ?? baseStoreState.profiles,
          gameHistoryByProfile: initialState.gameHistoryByProfile ?? baseStoreState.gameHistoryByProfile,
          leaderboard: initialState.leaderboard ?? baseStoreState.leaderboard,
        });

        return () => {
          Date.now = originalDateNow;
        };
      }, [initialState]);

      return (
        <GameCanvas>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof HomeOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Weekly progress available',
  args: {
    initialState: weeklyProgressMock,
  },
};

export const EmptyWeek: Story = {
  name: 'No weekly activity',
  args: {
    initialState: emptyWeekMock,
  },
};
