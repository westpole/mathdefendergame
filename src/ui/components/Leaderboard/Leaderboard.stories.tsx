import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import { GameStoreState, useGameStore } from '@store/useGameStore';

import emptyMock from './__mocks__/empty.json';
import withDataMock from './__mocks__/withData.json';
import { Leaderboard } from '.';

interface StoryArgs {
  initialState: Partial<GameStoreState>;
}

const meta = {
  title: 'Screens/Leaderboard',
  component: Leaderboard,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const syncHUD = useGameStore((state) => state.syncHUD);
      const initialState = (context.parameters as unknown as StoryArgs).initialState;

      useEffect(() => {
        syncHUD(initialState);
      }, [syncHUD, initialState]);

      return (
        <GameCanvas>
          <section style={{
            width: '80%',
            height: '240px',
            margin: '3em auto'
          }}>
            <Story />
          </section>
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof Leaderboard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Empty',
  args: {
    initialGrade: 'trainee',
    limit: 5,
  },
  parameters: {
    initialState: {
      ...emptyMock,
    },
  },
};

export const WithData: Story = {
  name: 'With Data',
  args: {
    initialGrade: 'major-general',
    limit: 10,
  },
  parameters: {
    initialState: {
      ...withDataMock,
    },
  },
};
