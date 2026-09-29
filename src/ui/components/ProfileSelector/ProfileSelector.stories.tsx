import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import { ProfileSelector } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
}

const meta = {
  title: 'Screens/ProfileSelector',
  component: ProfileSelector,
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
} satisfies Meta<typeof ProfileSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialState: {
      bootReady: true,
      phase: 'login',
      profiles: {
        AcePilot: {
          username: 'AcePilot',
          password: 'enc:v1:test',
          bestScore: 340,
          highestStage: 9,
          preferredGrade: 'commander',
          createdAt: 1,
          updatedAt: 2,
        },
        CadetNova: {
          username: 'CadetNova',
          password: 'enc:v1:test',
          bestScore: 160,
          highestStage: 5,
          preferredGrade: 'cadet',
          createdAt: 1,
          updatedAt: 3,
        },
      },
      rememberedUsername: null,
      activeUsername: null,
    },
  },
};

export const EmptyProfiles: Story = {
  args: {
    initialState: {
      bootReady: true,
      phase: 'login',
      profiles: {},
      rememberedUsername: null,
      activeUsername: null,
    },
  },
};

export const MobileSelector: Story = {
  args: {
    frame: popularMobileStoryFrame,
    initialState: {
      bootReady: true,
      phase: 'login',
      profiles: {
        AcePilot: {
          username: 'AcePilot',
          password: 'enc:v1:test',
          bestScore: 340,
          highestStage: 9,
          preferredGrade: 'commander',
          createdAt: 1,
          updatedAt: 2,
        },
      },
      rememberedUsername: null,
      activeUsername: null,
    },
  },
};
