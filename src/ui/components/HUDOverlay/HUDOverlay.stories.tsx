import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { minimumDesktopStoryFrame, popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import { HUDOverlay } from '.';
import fullShieldsLives from './__mocks__/full-shields-lives.json';
import lost1shield from './__mocks__/4-shields-3-lives.json';
import lost2shields1life from './__mocks__/3-shields-2-lives.json';
import lost3shields2lives from './__mocks__/2-shields-1-lives.json';
import lost4shields2lives from './__mocks__/1-shields-1-lives.json';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
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
      const { initialState, frame } = context.args as StoryArgs;

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
        <GameCanvas height={frame?.height} width={frame?.width}>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof HUDOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const fullShieldsLivesStory: Story = {
  name: 'Desktop: 5 shields and 3 lives',
  args: {
    initialState: fullShieldsLives,
    frame: minimumDesktopStoryFrame,
  },
};

export const lost1shieldStory: Story = {
  name: 'Desktop: 4 shields and 3 lives',
  args: {
    frame: minimumDesktopStoryFrame,
    initialState: lost1shield,
  },
};

export const lost2shields1lifeStory: Story = {
  name: 'Desktop: 3 shields and 2 lives',
  args: {
    frame: minimumDesktopStoryFrame,
    initialState: lost2shields1life,
  },
};

export const lost3shields2livesStory: Story = {
  name: 'Desktop: 2 shields and 1 life',
  args: {
    frame: minimumDesktopStoryFrame,
    initialState: lost3shields2lives,
  },
};

export const lost4shields2livesStory: Story = {
  name: 'Desktop: 1 shield and 1 life',
  args: {
    frame: minimumDesktopStoryFrame,
    initialState: lost4shields2lives,
  },
};

export const mobilefullShieldsLivesStory: Story = {
  name: 'Mobile: 5 shields and 3 lives',
  args: {
    frame: popularMobileStoryFrame,
    initialState: fullShieldsLives,
  },
};

export const mobilelost1shieldStory: Story = {
  name: 'Mobile: 4 shields and 3 lives',
  args: {
    frame: popularMobileStoryFrame,
    initialState: lost1shield,
  },
};

export const mobilelost2shields1lifeStory: Story = {
  name: 'Mobile: 3 shields and 2 lives',
  args: {
    frame: popularMobileStoryFrame,
    initialState: lost2shields1life,
  },
};

export const mobilelost3shields2livesStory: Story = {
  name: 'Mobile: 2 shields and 1 life',
  args: {
    frame: popularMobileStoryFrame,
    initialState: lost3shields2lives,
  },
};

export const mobilelost4shields2livesStory: Story = {
  name: 'Mobile: 1 shield and 1 life',
  args: {
    frame: popularMobileStoryFrame,
    initialState: lost4shields2lives,
  },
};
