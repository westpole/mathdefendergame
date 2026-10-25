import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
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
