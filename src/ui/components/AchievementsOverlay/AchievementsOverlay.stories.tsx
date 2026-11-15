import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, type ComponentProps } from 'react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import allMedalsMock from './__mocks__/allMedals.json';
import atRiskMock from './__mocks__/atRisk.json';
import atRiskWithShieldMock from './__mocks__/atRiskWithShield.json';
import bronzeEarnedMock from './__mocks__/bronzeEarned.json';
import emptyMock from './__mocks__/empty.json';
import goalCappedTodayMock from './__mocks__/goalCappedToday.json';
import goalMetMock from './__mocks__/goalMet.json';
import goalPartialMock from './__mocks__/goalPartial.json';
import goalZeroMock from './__mocks__/goalZero.json';
import midWeekMock from './__mocks__/midWeek.json';
import shieldBankedMock from './__mocks__/shieldBanked.json';
import twoWeekStreakMock from './__mocks__/twoWeekStreak.json';
import { AchievementsOverlay } from '.';

/** Thursday 12 Nov 2026, 12:00 UTC. Fixtures are built around this week. */
const STORY_NOW = 1794484800000;
/** Saturday 14 Nov 2026, 12:00 UTC, when the at-risk warning can show. */
const STORY_SATURDAY = 1794657600000;

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

export const BronzeEarned: Story = {
  name: 'Relentless Bronze earned',
  args: { now: STORY_NOW, initialState: bronzeEarnedMock as Partial<GameStoreState> },
};

export const AllMedals: Story = {
  name: 'All Relentless medals earned',
  args: { now: STORY_NOW, initialState: allMedalsMock as Partial<GameStoreState> },
};

export const AllMedalsUkrainian: Story = {
  name: 'All Relentless medals earned (uk)',
  globals: { locale: 'uk' },
  args: { now: STORY_NOW, initialState: allMedalsMock as Partial<GameStoreState> },
};

export const MobileBronzeEarned: Story = {
  name: 'Mobile Relentless Bronze earned',
  args: { now: STORY_NOW, frame: popularMobileStoryFrame, initialState: bronzeEarnedMock as Partial<GameStoreState> },
};

export const MobileAllMedals: Story = {
  name: 'Mobile all Relentless medals earned',
  args: { now: STORY_NOW, frame: popularMobileStoryFrame, initialState: allMedalsMock as Partial<GameStoreState> },
};

export const ShieldBanked: Story = {
  name: 'Streak shield banked',
  args: { now: STORY_NOW, initialState: shieldBankedMock as Partial<GameStoreState> },
};

export const AtRisk: Story = {
  name: 'Streak at risk (Saturday)',
  args: { now: STORY_SATURDAY, initialState: atRiskMock as Partial<GameStoreState> },
};

export const AtRiskWithShield: Story = {
  name: 'At risk, shield will protect',
  args: { now: STORY_SATURDAY, initialState: atRiskWithShieldMock as Partial<GameStoreState> },
};

export const MobileShieldBanked: Story = {
  name: 'Mobile streak shield banked',
  args: { now: STORY_NOW, frame: popularMobileStoryFrame, initialState: shieldBankedMock as Partial<GameStoreState> },
};

export const MobileAtRisk: Story = {
  name: 'Mobile streak at risk',
  args: { now: STORY_SATURDAY, frame: popularMobileStoryFrame, initialState: atRiskMock as Partial<GameStoreState> },
};

export const MobileAtRiskWithShield: Story = {
  name: 'Mobile at risk, shield will protect',
  args: { now: STORY_SATURDAY, frame: popularMobileStoryFrame, initialState: atRiskWithShieldMock as Partial<GameStoreState> },
};

export const GoalZero: Story = {
  name: 'Weekly goal at 0%',
  args: { now: STORY_NOW, initialState: goalZeroMock as Partial<GameStoreState> },
};

export const MobileGoalZero: Story = {
  name: 'Mobile weekly goal at 0%',
  args: { now: STORY_NOW, frame: popularMobileStoryFrame, initialState: goalZeroMock as Partial<GameStoreState> },
};

export const GoalPartial: Story = {
  name: 'Weekly goal partly reached',
  args: { now: STORY_NOW, initialState: goalPartialMock as Partial<GameStoreState> },
};

export const MobileGoalPartial: Story = {
  name: 'Mobile weekly goal partly reached',
  args: { now: STORY_NOW, frame: popularMobileStoryFrame, initialState: goalPartialMock as Partial<GameStoreState> },
};

export const GoalCappedToday: Story = {
  name: 'Weekly goal capped today',
  args: { now: STORY_NOW, initialState: goalCappedTodayMock as Partial<GameStoreState> },
};

export const MobileGoalCappedToday: Story = {
  name: 'Mobile weekly goal capped today',
  args: { now: STORY_NOW, frame: popularMobileStoryFrame, initialState: goalCappedTodayMock as Partial<GameStoreState> },
};

export const GoalMet: Story = {
  name: 'Weekly goal met',
  args: { now: STORY_NOW, initialState: goalMetMock as Partial<GameStoreState> },
};

export const MobileGoalMet: Story = {
  name: 'Mobile weekly goal met',
  args: { now: STORY_NOW, frame: popularMobileStoryFrame, initialState: goalMetMock as Partial<GameStoreState> },
};
