import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useGameStore, type GameStoreState } from '@store/useGameStore';
import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import baseStoreState from '@ui/components/__mocks__/base-store-state.json';

import escapePauseMock from './__mocks__/escape-pause.json';
import savingBeforeCloseMock from './__mocks__/saving-before-close.json';
import windowCloseMock from './__mocks__/window-close.json';
import { PauseOverlay } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
}

const meta = {
  title: 'Screens/PauseOverlay',
  component: PauseOverlay,
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
} satisfies Meta<typeof PauseOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EscapePause: Story = {
  name: 'Pause prompt',
  args: {
    initialState: escapePauseMock,
  },
};

export const WindowClosePrompt: Story = {
  name: 'Window close prompt',
  args: {
    initialState: windowCloseMock,
  },
};

export const SavingBeforeClose: Story = {
  name: 'Saving before close',
  args: {
    initialState: savingBeforeCloseMock,
  },
};