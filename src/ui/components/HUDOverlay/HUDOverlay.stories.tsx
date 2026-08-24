import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useGameStore, type GameStoreState } from '@store/useGameStore';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/base-store-state.json';

import { HUDOverlay } from '.';
import fullShieldsLives from './__mocks__/full-shields-lives.json';
import lost1shield from './__mocks__/4-shields-3-lives.json';
import lost2shields1life from './__mocks__/3-shields-2-lives.json';
import lost3shields2lives from './__mocks__/2-shields-1-lives.json';
import lost4shields2lives from './__mocks__/1-shields-1-lives.json';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
}

const meta = {
  title: 'Screens/HUDOverlay',
  component: HUDOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const { initialState } = context.args as StoryArgs;

      useEffect(() => {
        useGameStore.setState({
          ...baseStoreState,
          ...initialState,
          profiles: initialState.profiles ?? baseStoreState.profiles,
          gameHistoryByProfile: initialState.gameHistoryByProfile ?? baseStoreState.gameHistoryByProfile,
          leaderboard: initialState.leaderboard ?? baseStoreState.leaderboard,
          stageMessage: initialState.stageMessage ?? baseStoreState.stageMessage,
          streakRewardMessage: initialState.streakRewardMessage ?? baseStoreState.streakRewardMessage,
          pauseOverlay: initialState.pauseOverlay ?? baseStoreState.pauseOverlay,
        });
      }, [initialState]);

      return (
        <GameCanvas>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof HUDOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const fullShieldsLivesStory: Story = {
  name: 'HUD: 5 shields and 3 lives',
  args: {
    initialState: fullShieldsLives,
  },
};

export const lost1shieldStory: Story = {
  name: 'HUD: 4 shields and 3 lives',
  args: {
    initialState: lost1shield,
  },
};

export const lost2shields1lifeStory: Story = {
  name: 'HUD: 3 shields and 2 lives',
  args: {
    initialState: lost2shields1life,
  },
};

export const lost3shields2livesStory: Story = {
  name: 'HUD: 2 shields and 1 life',
  args: {
    initialState: lost3shields2lives,
  },
};

export const lost4shields2livesStory: Story = {
  name: 'HUD: 1 shield and 1 life',
  args: {
    initialState: lost4shields2lives,
  },
};
