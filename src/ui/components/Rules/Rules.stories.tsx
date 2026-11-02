import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import {
  minimumDesktopStoryFrame,
  minimumMobileStoryFrame,
  popularMobileStoryFrame,
  type StoryFrame,
} from '@ui/components/__mocks__/storyFrames';

import { RulesOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
}

const mobileLandscapeStoryFrame: StoryFrame = {
  width: popularMobileStoryFrame.height,
  height: popularMobileStoryFrame.width,
};

const meta = {
  title: 'Screens/RulesOverlay',
  component: RulesOverlay,
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
} satisfies Meta<typeof RulesOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Desktop rules',
  args: {
    frame: minimumDesktopStoryFrame,
    initialState: {
      phase: 'start',
      screenView: 'rules',
      isMobileDevice: false,
    },
  },
};

export const MobilePortrait: Story = {
  name: 'Mobile rules (portrait)',
  args: {
    frame: popularMobileStoryFrame,
    initialState: {
      phase: 'start',
      screenView: 'rules',
      isMobileDevice: true,
    },
  },
};

export const MobileSmallPortrait: Story = {
  name: 'Mobile rules (small portrait)',
  args: {
    frame: minimumMobileStoryFrame,
    initialState: {
      phase: 'start',
      screenView: 'rules',
      isMobileDevice: true,
    },
  },
};

export const MobileLandscape: Story = {
  name: 'Mobile rules (landscape)',
  args: {
    frame: mobileLandscapeStoryFrame,
    initialState: {
      phase: 'start',
      screenView: 'rules',
      isMobileDevice: true,
    },
  },
};
