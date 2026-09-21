import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore, type GameStoreState } from '@store/useGameStore';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import commanderRexMock from '../ProfileOverlay/__mocks__/commanderRex.json';
import { PerformanceOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
}

const meta = {
  title: 'Screens/PerformanceOverlay',
  component: PerformanceOverlay,
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
          leaderboard: initialState.leaderboard ?? baseStoreState.leaderboard,
        });
      }, [initialState]);

      return (
        <GameCanvas height={frame?.height} width={frame?.width}>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof PerformanceOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialState: {
      ...commanderRexMock,
      screenView: 'performance',
      phase: 'start',
    },
  },
};

export const MobilePerformance: Story = {
  name: 'Mobile performance report',
  args: {
    frame: popularMobileStoryFrame,
    initialState: {
      ...commanderRexMock,
      screenView: 'performance',
      phase: 'start',
    },
  },
};
