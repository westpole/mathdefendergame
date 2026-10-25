import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import emptyWeekMock from '../HomeOverlay/__mocks__/empty-week.json';
import weeklyProgressMock from '../HomeOverlay/__mocks__/weekly-progress.json';
import { WeeklyReportOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
}

const meta = {
  title: 'Screens/WeeklyReportOverlay',
  component: WeeklyReportOverlay,
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
        });
      }, [initialState]);

      return (
        <GameCanvas height={frame?.height} width={frame?.width}>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof WeeklyReportOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithProgress: Story = {
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

export const Mobile: Story = {
  name: 'Mobile weekly report',
  args: {
    frame: popularMobileStoryFrame,
    initialState: weeklyProgressMock,
  },
};
