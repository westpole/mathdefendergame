import { useEffect, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { initialState } from '@store/constants';
import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import { CreateProfileForm } from '.';

type CreateProfileFormStoryArgs = ComponentProps<typeof CreateProfileForm> & {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
};

const meta = {
  title: 'Screens/CreateProfileForm',
  component: CreateProfileForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    initialState: {
      profiles: {},
      gameHistoryByProfile: {},
    },
  },
  decorators: [
    (Story, context) => {
      const { initialState: customState, frame } = context.args as CreateProfileFormStoryArgs;

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
} satisfies Meta<CreateProfileFormStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  name: 'Desktop create username',
  args: {
    initialState: {
      profiles: {},
      gameHistoryByProfile: {},
    },
  },
};

export const Mobile: Story = {
  name: 'Mobile create username',
  args: {
    frame: popularMobileStoryFrame,
    initialState: {
      profiles: {},
      gameHistoryByProfile: {},
    },
  },
};
