import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import emptyWeekMock from '../HomeOverlay/__mocks__/empty-week.json';
import weeklyProgressMock from '../HomeOverlay/__mocks__/weekly-progress.json';
import cadetNoMultiplicationMock from '../ProfileOverlay/__mocks__/cadetNoMultiplication.json';
import majorGeneralMock from '../ProfileOverlay/__mocks__/majorGeneral.json';
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

export const CadetNoMultiplication: Story = {
  name: 'Cadet with × at 0',
  args: {
    initialState: cadetNoMultiplicationMock,
  },
};

export const MajorGeneral: Story = {
  name: 'Major General (requirements to hold)',
  args: {
    initialState: majorGeneralMock,
  },
};

export const Mobile: Story = {
  name: 'Mobile weekly report',
  args: {
    frame: popularMobileStoryFrame,
    initialState: weeklyProgressMock,
  },
};

export const MobileCadetNoMultiplication: Story = {
  name: 'Mobile Cadet with × at 0',
  args: {
    frame: popularMobileStoryFrame,
    initialState: cadetNoMultiplicationMock,
  },
};

export const MobileMajorGeneral: Story = {
  name: 'Mobile Major General',
  args: {
    frame: popularMobileStoryFrame,
    initialState: majorGeneralMock,
  },
};
