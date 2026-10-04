import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { initialState } from '@store/constants';
import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import { CreateProfileForm } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
  simpleMode: boolean;
}

const meta = {
  title: 'Screens/CreateProfileForm',
  component: CreateProfileForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    simpleMode: false,
  },
  decorators: [
    (Story, context) => {
      const { initialState: customState, frame } = context.args as StoryArgs;

      useEffect(() => {
        useGameStore.setState({
          ...initialState,
          ...customState,
          bootReady: true,
          phase: 'login',
          screenView: 'home',
          activeUsername: null,
          rememberedUsername: null,
          profiles: customState.profiles ?? {},
          gameHistoryByProfile: customState.gameHistoryByProfile ?? {},
        });
      }, [customState]);

      return (
        <GameCanvas height={frame?.height} width={frame?.width}>
          <div className="overlay-screen overlay-screen--interactive">
            <div className="overlay-panel login-panel">
              <Story />
            </div>
          </div>
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof CreateProfileForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DesktopWithPassword: Story = {
  name: 'Desktop create username with password',
  args: {
    simpleMode: false,
    initialState: {
      profiles: {},
      gameHistoryByProfile: {},
    },
  },
};

export const DesktopWithoutPassword: Story = {
  name: 'Desktop create username without password',
  args: {
    simpleMode: true,
    initialState: {
      profiles: {},
      gameHistoryByProfile: {},
    },
  },
};

export const MobileWithPassword: Story = {
  name: 'Mobile create username with password',
  args: {
    frame: popularMobileStoryFrame,
    simpleMode: false,
    initialState: {
      profiles: {},
      gameHistoryByProfile: {},
    },
  },
};

export const MobileWithoutPassword: Story = {
  name: 'Mobile create username without password',
  args: {
    frame: popularMobileStoryFrame,
    simpleMode: true,
    initialState: {
      profiles: {},
      gameHistoryByProfile: {},
    },
  },
};
