import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import GameCanvas from '@ui/components/__mocks__/GameCanvas';
import { useGameStore } from '@store/useGameStore';

import { StageMessageOverlay } from '.';

const meta = {
  title: 'Screens/StageMessageOverlay',
  component: StageMessageOverlay,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      const showStageMessage = useGameStore((state) => state.showStageMessage);

      useEffect(() => {
        showStageMessage({
          stage: 1,
          score: 1000,
          lives: 3,
          success: true,
          stageIncorrect: 0,
        });
      }, [showStageMessage]);

      return (
        <GameCanvas>
          <Story />
        </GameCanvas>
      );
    },
  ],
} satisfies Meta<typeof StageMessageOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
