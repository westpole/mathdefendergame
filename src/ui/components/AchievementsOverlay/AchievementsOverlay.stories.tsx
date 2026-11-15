import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, type ComponentProps } from 'react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import emptyMock from './__mocks__/empty.json';
import midWeekMock from './__mocks__/midWeek.json';
import twoWeekStreakMock from './__mocks__/twoWeekStreak.json';
import { AchievementsOverlay } from '.';

/** Thursday 12 Nov 2026, 12:00 UTC. Fixtures are built around this week. */
const STORY_NOW = 1794484800000;

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
  now: number;
}

type StoryProps = ComponentProps<typeof AchievementsOverlay> & StoryArgs;

const meta = {
  title: 'Screens/AchievementsOverlay',
  component: AchievementsOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const { initialState, frame } = context.args;

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
} satisfies Meta<StoryProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EmptyHistory: Story = {
  name: 'Empty history',
  args: { now: STORY_NOW, initialState: emptyMock as Partial<GameStoreState> },
};

export const MidWeekPartial: Story = {
  name: 'Mid-week, 2 of 3 days',
  args: { now: STORY_NOW, initialState: midWeekMock as Partial<GameStoreState> },
};

export const TwoWeekStreak: Story = {
  name: 'Two-week streak',
  args: { now: STORY_NOW, initialState: twoWeekStreakMock as Partial<GameStoreState> },
};

export const MobileEmptyHistory: Story = {
  name: 'Mobile empty history',
  args: { now: STORY_NOW, frame: popularMobileStoryFrame, initialState: emptyMock as Partial<GameStoreState> },
};

export const MobileMidWeekPartial: Story = {
  name: 'Mobile mid-week, 2 of 3 days',
  args: { now: STORY_NOW, frame: popularMobileStoryFrame, initialState: midWeekMock as Partial<GameStoreState> },
};

export const MobileTwoWeekStreak: Story = {
  name: 'Mobile two-week streak',
  args: { now: STORY_NOW, frame: popularMobileStoryFrame, initialState: twoWeekStreakMock as Partial<GameStoreState> },
};
