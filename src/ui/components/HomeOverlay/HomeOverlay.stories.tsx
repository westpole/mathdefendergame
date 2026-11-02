import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState, PlayerProfile } from '@store/types';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import { HomeOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
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
} satisfies Meta<typeof HomeOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default home launch',
  args: {
    initialState: {
      activeUsername: 'AcePilot',
      grade: 'cadet',
      phase: 'start',
      practiceOperation: '+',
    },
  },
};

export const PracticeOperationSelected: Story = {
  name: 'Practice mode operation selected',
  args: {
    initialState: {
      activeUsername: 'AcePilot',
      grade: 'commander',
      phase: 'start',
      practiceOperation: '*',
    },
  },
};

export const MobileLayout: Story = {
  name: 'Mobile home layout',
  args: {
    frame: popularMobileStoryFrame,
    initialState: {
      activeUsername: 'AcePilot',
      grade: 'cadet',
      phase: 'start',
      practiceOperation: '/',
    },
  },
};

const acePilotProfile: PlayerProfile = {
  username: 'AcePilot',
  password: '',
  bestScore: 120,
  highestStage: 6,
  preferredGrade: 'cadet',
  createdAt: 1_756_000_000_000,
  updatedAt: 1_756_000_000_000,
};

export const RulesHintVisible: Story = {
  name: 'Rules hint visible',
  args: {
    initialState: {
      activeUsername: 'AcePilot',
      grade: 'cadet',
      phase: 'start',
      practiceOperation: '+',
      profiles: { AcePilot: acePilotProfile },
    },
  },
};

export const RulesHintDismissed: Story = {
  name: 'Rules hint dismissed',
  args: {
    initialState: {
      activeUsername: 'AcePilot',
      grade: 'cadet',
      phase: 'start',
      practiceOperation: '+',
      profiles: { AcePilot: { ...acePilotProfile, rulesHintDismissed: true } },
    },
  },
};

export const MobileRulesHintVisible: Story = {
  name: 'Mobile rules hint visible',
  args: {
    frame: popularMobileStoryFrame,
    initialState: {
      activeUsername: 'AcePilot',
      grade: 'cadet',
      phase: 'start',
      practiceOperation: '+',
      isMobileDevice: true,
      profiles: { AcePilot: acePilotProfile },
    },
  },
};

export const MobileRulesHintDismissed: Story = {
  name: 'Mobile rules hint dismissed',
  args: {
    frame: popularMobileStoryFrame,
    initialState: {
      activeUsername: 'AcePilot',
      grade: 'cadet',
      phase: 'start',
      practiceOperation: '+',
      isMobileDevice: true,
      profiles: { AcePilot: { ...acePilotProfile, rulesHintDismissed: true } },
    },
  },
};
