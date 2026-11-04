import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import demotedOneOperationMock from './__mocks__/demotedOneOperation.json';
import demotedTwoOperationsMock from './__mocks__/demotedTwoOperations.json';
import promotedMock from './__mocks__/promoted.json';
import { GradeNoticeOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
}

const meta = {
  title: 'Screens/GradeNoticeOverlay',
  component: GradeNoticeOverlay,
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
} satisfies Meta<typeof GradeNoticeOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Promoted: Story = {
  name: 'Promoted to Cadet',
  args: {
    initialState: promotedMock,
  },
};

export const DemotedOneOperation: Story = {
  name: 'Demoted, one operation short',
  args: {
    initialState: demotedOneOperationMock,
  },
};

export const DemotedTwoOperations: Story = {
  name: 'Demoted, two operations short',
  args: {
    initialState: demotedTwoOperationsMock,
  },
};

export const MobilePromoted: Story = {
  name: 'Mobile promoted to Cadet',
  args: {
    frame: popularMobileStoryFrame,
    initialState: promotedMock,
  },
};

export const MobileDemotedOneOperation: Story = {
  name: 'Mobile demoted, one operation short',
  args: {
    frame: popularMobileStoryFrame,
    initialState: demotedOneOperationMock,
  },
};

export const MobileDemotedTwoOperations: Story = {
  name: 'Mobile demoted, two operations short',
  args: {
    frame: popularMobileStoryFrame,
    initialState: demotedTwoOperationsMock,
  },
};
