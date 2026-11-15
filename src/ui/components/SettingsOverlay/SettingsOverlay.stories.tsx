import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, type ComponentProps } from 'react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import profileMenuStore from '../__mocks__/profile-menu-store.json';
import goalSetMock from './__mocks__/goalSet.json';
import suggestedGoalMock from './__mocks__/suggestedGoal.json';
import { SettingsOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
}

type StoryProps = ComponentProps<typeof SettingsOverlay> & StoryArgs;

/** Thursday 12 Nov 2026, 12:00 UTC. The suggested-goal fixture is built around this week. */
const STORY_NOW = 1794484800000;

const meta = {
  title: 'Screens/SettingsOverlay',
  component: SettingsOverlay,
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

export const Default: Story = {
  args: {
    initialState: {
      ...(structuredClone(profileMenuStore) as Partial<GameStoreState>),
      screenView: 'settings',
      phase: 'start',
    },
  },
};

export const MobileSettings: Story = {
  name: 'Mobile settings',
  args: {
    frame: popularMobileStoryFrame,
    initialState: {
      ...(structuredClone(profileMenuStore) as Partial<GameStoreState>),
      screenView: 'settings',
      phase: 'start',
    },
  },
};

export const WeeklyGoalSet: Story = {
  name: 'Weekly goal set to 1,000',
  args: {
    initialState: { ...(structuredClone(goalSetMock) as Partial<GameStoreState>), phase: 'start' },
  },
};

export const MobileWeeklyGoalSet: Story = {
  name: 'Mobile weekly goal set to 1,000',
  args: {
    frame: popularMobileStoryFrame,
    initialState: { ...(structuredClone(goalSetMock) as Partial<GameStoreState>), phase: 'start' },
  },
};

export const SuggestedGoal: Story = {
  name: 'Weekly goal with Suggested (900)',
  args: {
    now: STORY_NOW,
    initialState: { ...(structuredClone(suggestedGoalMock) as Partial<GameStoreState>), phase: 'start' },
  },
};

export const MobileSuggestedGoal: Story = {
  name: 'Mobile weekly goal with Suggested (900)',
  args: {
    now: STORY_NOW,
    frame: popularMobileStoryFrame,
    initialState: { ...(structuredClone(suggestedGoalMock) as Partial<GameStoreState>), phase: 'start' },
  },
};
