import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useGameStore, type GameStoreState } from '@store/useGameStore';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import { LoginOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
}

const meta = {
  title: 'Screens/LoginOverlay',
  component: LoginOverlay,
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
} satisfies Meta<typeof LoginOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialState: {
      bootReady: true,
      phase: 'login',
      rememberedUsername: null,
    },
  },
};

export const MobileLogin: Story = {
  name: 'Mobile login form',
  args: {
    frame: popularMobileStoryFrame,
    initialState: {
      bootReady: true,
      phase: 'login',
      rememberedUsername: null,
    },
  },
};
