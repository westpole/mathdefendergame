import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GameHistoryEntry } from '@shared/types';
import { at, makeRun } from '@store/selectors/__tests__/achievementTestUtils';
import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import i18n from '../../../../i18n/config';
import baseStoreState from '../../__mocks__/base-store-state.json';
import { GameOverOverlay } from '..';

vi.mock('@game/scenes/UIScene', () => ({
  startGame: vi.fn(),
}));

const featureFlagMocks = vi.hoisted(() => ({
  overrides: {} as Record<string, boolean>,
}));

vi.mock('@shared/featureFlags', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/featureFlags')>();

  return {
    ...actual,
    isFeatureEnabled: (flagName: string, fallbackValue?: boolean) => (
      featureFlagMocks.overrides[flagName] ?? actual.isFeatureEnabled(flagName, fallbackValue)
    ),
  };
});

const run = (playedAt: number, finalScore: number, correctAnswers = 17, incorrectAnswers = 3) => (
  makeRun(playedAt, { finalScore, correctAnswers, incorrectAnswers })
);

function seed(history: GameHistoryEntry[], { goal = 1000, guest = false } = {}) {
  useGameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    phase: 'gameover',
    bootReady: true,
    activeUsername: guest ? null : 'AcePilot',
    profiles: guest ? {} : {
      AcePilot: {
        username: 'AcePilot',
        password: 'x',
        bestScore: 0,
        highestStage: 1,
        preferredGrade: 'trainee',
        createdAt: 1,
        updatedAt: 1,
        ...(goal && { weeklyScoreGoal: goal }),
      },
    },
    gameHistoryByProfile: { [guest ? '__guest__' : 'AcePilot']: history },
  });
}

describe('GameOverOverlay weekly goal line', () => {
  beforeEach(async () => {
    featureFlagMocks.overrides = {};
    await i18n.changeLanguage('en');
  });

  it('says how much a qualifying run counted and the new percent', () => {
    seed([run(at(2026, 11, 10), 320), run(at(2026, 11, 9), 360)]);
    render(<GameOverOverlay />);

    expect(screen.getByTestId('gameover-goal-line')).toHaveTextContent('✓ Counts toward weekly goal: +320 (68%)');
  });

  it('asks for 85% when accuracy is too low', () => {
    seed([run(at(2026, 11, 10), 320, 78, 22)]);
    render(<GameOverOverlay />);

    expect(screen.getByTestId('gameover-goal-line')).toHaveTextContent('78% accuracy, reach 85% for it to count');
  });

  it('says the daily cap is reached', () => {
    seed([run(at(2026, 11, 10, 12), 100), run(at(2026, 11, 10, 9), 450)]);
    render(<GameOverOverlay />);

    expect(screen.getByTestId('gameover-goal-line')).toHaveTextContent('Daily goal limit reached, come back tomorrow!');
  });

  it('explains that short runs do not count', () => {
    seed([run(at(2026, 11, 10), 100, 9, 0)]);
    render(<GameOverOverlay />);

    expect(screen.getByTestId('gameover-goal-line')).toHaveTextContent('Runs need at least 10 answers');
  });

  it('never shows 100% before the goal is met', () => {
    seed([run(at(2026, 11, 10), 399), run(at(2026, 11, 9), 400), run(at(2026, 11, 8), 196)], { goal: 1000 });
    render(<GameOverOverlay />);

    expect(screen.getByTestId('gameover-goal-line')).toHaveTextContent('+399 (79%)');
  });

  it('formats the accuracy for the language', async () => {
    await i18n.changeLanguage('uk');
    seed([run(at(2026, 11, 10), 320, 849, 151)]);
    render(<GameOverOverlay />);

    expect(screen.getByTestId('gameover-goal-line')).toHaveTextContent('Точність 84,9%');
  });

  it('uses the newest run even when history is not sorted', () => {
    seed([run(at(2026, 11, 9), 360, 78, 22), run(at(2026, 11, 10), 100)]);
    render(<GameOverOverlay />);

    expect(screen.getByTestId('gameover-goal-line')).toHaveTextContent('+100');
  });

  it.each([
    ['the goal is off', { goal: 0 }],
    ['the player is a guest', { guest: true }],
  ])('shows nothing when %s', (_name, options) => {
    seed([run(at(2026, 11, 10), 320)], options);
    render(<GameOverOverlay />);

    expect(screen.queryByTestId('gameover-goal-line')).not.toBeInTheDocument();
  });

  it('shows nothing without history or when the achievements flag is off', () => {
    seed([]);
    const { unmount } = render(<GameOverOverlay />);
    expect(screen.queryByTestId('gameover-goal-line')).not.toBeInTheDocument();
    unmount();

    featureFlagMocks.overrides = { achievements: false };
    seed([run(at(2026, 11, 10), 320)]);
    render(<GameOverOverlay />);
    expect(screen.queryByTestId('gameover-goal-line')).not.toBeInTheDocument();
  });

  it('renders in Ukrainian', async () => {
    await i18n.changeLanguage('uk');
    seed([run(at(2026, 11, 10), 320)]);
    render(<GameOverOverlay />);

    expect(screen.getByTestId('gameover-goal-line')).toHaveTextContent('✓ Зараховано до тижневої цілі: +320 (32%)');
  });
});
