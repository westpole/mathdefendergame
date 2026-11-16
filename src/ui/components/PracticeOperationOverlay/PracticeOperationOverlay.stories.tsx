import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, type ComponentProps } from 'react';

import type { PracticeOperation } from '@shared/types';
import { useGameStore } from '@store/useGameStore';
import type { GameStoreState, PlayerProfile } from '@store/types';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import {
  minimumDesktopStoryFrame,
  minimumMobileStoryFrame,
  popularMobileStoryFrame,
  type StoryFrame,
} from '@ui/components/__mocks__/storyFrames';

import focusHistoryMock from './__mocks__/focusHistory.json';
import { PracticeOperationOverlay } from '.';

/** Thursday 12 Nov 2026, 12:00 UTC. The focus fixture flags × in the two weeks before. */
const STORY_NOW = 1794484800000;

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
}

type StoryProps = ComponentProps<typeof PracticeOperationOverlay> & StoryArgs;

/** Builds the active story profile; omit the operation for a profile that has never practiced. */
function buildProfiles(lastPracticeOperation?: PracticeOperation): Record<string, PlayerProfile> {
  return {
    AcePilot: {
      username: 'AcePilot',
      bestScore: 120,
      highestStage: 6,
      preferredGrade: 'cadet',
      createdAt: 1_756_000_000_000,
      updatedAt: 1_756_000_000_000,
      ...(lastPracticeOperation && { lastPracticeOperation }),
    },
  };
}

const meta = {
  title: 'Screens/PracticeOperationOverlay',
  component: PracticeOperationOverlay,
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
          phase: 'start',
          screenView: 'practice-select',
          activeUsername: 'AcePilot',
          ...initialState,
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
  name: 'Default (never practiced, no badge)',
  args: {
    initialState: { profiles: buildProfiles() },
  },
};

export const MultiplicationLastPracticed: Story = {
  name: 'Multiplication last practiced',
  args: {
    initialState: { profiles: buildProfiles('*') },
  },
};

export const Desktop: Story = {
  name: 'Desktop operation selector',
  args: {
    frame: minimumDesktopStoryFrame,
    initialState: { profiles: buildProfiles('-') },
  },
};

export const Mobile: Story = {
  name: 'Mobile operation selector',
  args: {
    frame: popularMobileStoryFrame,
    initialState: { profiles: buildProfiles('/'), isMobileDevice: true },
  },
};

export const MobileMinimum: Story = {
  name: 'Minimum mobile operation selector',
  args: {
    frame: minimumMobileStoryFrame,
    initialState: { profiles: buildProfiles(), isMobileDevice: true },
  },
};

export const FocusTag: Story = {
  name: 'Focus of the Week tag on ×',
  args: {
    now: STORY_NOW,
    initialState: {
      profiles: buildProfiles('+'),
      gameHistoryByProfile: focusHistoryMock as GameStoreState['gameHistoryByProfile'],
    },
  },
};

export const MobileFocusTag: Story = {
  name: 'Mobile Focus of the Week tag on ×',
  args: {
    now: STORY_NOW,
    frame: popularMobileStoryFrame,
    initialState: {
      profiles: buildProfiles('+'),
      gameHistoryByProfile: focusHistoryMock as GameStoreState['gameHistoryByProfile'],
      isMobileDevice: true,
    },
  },
};
