import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/baseStoreState';
import { popularMobileStoryFrame, type StoryFrame } from '@ui/components/__mocks__/storyFrames';

import cadetNoMultiplicationMock from './__mocks__/cadetNoMultiplication.json';
import freshTraineeMock from './__mocks__/freshTrainee.json';
import majorGeneralMock from './__mocks__/majorGeneral.json';
import traineePartialMock from './__mocks__/traineePartial.json';
import { ProfileOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
  frame?: StoryFrame;
}

const meta = {
  title: 'Screens/ProfileOverlay',
  component: ProfileOverlay,
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
} satisfies Meta<typeof ProfileOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FreshTrainee: Story = {
  name: 'Fresh Trainee (no history)',
  args: {
    initialState: freshTraineeMock,
  },
};

export const TraineePartial: Story = {
  name: 'Trainee, + met and − partly met',
  args: {
    initialState: traineePartialMock,
  },
};

export const CadetNoMultiplication: Story = {
  name: 'Cadet with × at 0',
  args: {
    initialState: cadetNoMultiplicationMock,
  },
};

export const MajorGeneral: Story = {
  name: 'Major General (requirements to hold)',
  args: {
    initialState: majorGeneralMock,
  },
};

export const MobileFreshTrainee: Story = {
  name: 'Mobile fresh Trainee',
  args: {
    frame: popularMobileStoryFrame,
    initialState: freshTraineeMock,
  },
};

export const MobileTraineePartial: Story = {
  name: 'Mobile Trainee, + met and − partly met',
  args: {
    frame: popularMobileStoryFrame,
    initialState: traineePartialMock,
  },
};

export const MobileCadetNoMultiplication: Story = {
  name: 'Mobile Cadet with × at 0',
  args: {
    frame: popularMobileStoryFrame,
    initialState: cadetNoMultiplicationMock,
  },
};

export const MobileMajorGeneral: Story = {
  name: 'Mobile Major General',
  args: {
    frame: popularMobileStoryFrame,
    initialState: majorGeneralMock,
  },
};
