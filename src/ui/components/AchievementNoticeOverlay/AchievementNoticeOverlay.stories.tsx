import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import bronzeMock from './__mocks__/bronze.json';
import silverAndGoldMock from './__mocks__/silverAndGold.json';
import { AchievementNoticeOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
}

const meta = {
  title: 'Screens/AchievementNoticeOverlay',
  component: AchievementNoticeOverlay,
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
        });
      }, [initialState]);

      return (
        <GameCanvas height={frame?.height} width={frame?.width}>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof AchievementNoticeOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RelentlessBronze: Story = {
  name: 'Relentless Bronze earned',
  args: { initialState: bronzeMock as Partial<GameStoreState> },
};

export const RelentlessBronzeUkrainian: Story = {
  name: 'Relentless Bronze earned (uk)',
  globals: { locale: 'uk' },
  args: { initialState: bronzeMock as Partial<GameStoreState> },
};

export const SilverAndGold: Story = {
  name: 'Two medals at once',
  args: { initialState: silverAndGoldMock as Partial<GameStoreState> },
};

export const MobileRelentlessBronze: Story = {
  name: 'Mobile Relentless Bronze earned',
  args: { frame: popularMobileStoryFrame, initialState: bronzeMock as Partial<GameStoreState> },
};

export const MobileRelentlessBronzeUkrainian: Story = {
  name: 'Mobile Relentless Bronze earned (uk)',
  globals: { locale: 'uk' },
  args: { frame: popularMobileStoryFrame, initialState: bronzeMock as Partial<GameStoreState> },
};
