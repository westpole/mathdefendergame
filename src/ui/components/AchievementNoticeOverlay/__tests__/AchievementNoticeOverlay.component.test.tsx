import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';

import i18n from '../../../../i18n/config';
import baseStoreState from '../../__mocks__/base-store-state.json';
import { AchievementNoticeOverlay } from '..';

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

const bronze = { id: 'weekly-streak-bronze' as const, earnedAt: 1, weekKey: '2026-W46' };
const silver = { id: 'weekly-streak-silver' as const, earnedAt: 2, weekKey: '2026-W49' };

function seed(partialState: Partial<GameStoreState>) {
  useGameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    phase: 'gameover',
    bootReady: true,
    ...partialState,
  });
}

describe('AchievementNoticeOverlay', () => {
  beforeEach(async () => {
    featureFlagMocks.overrides = {};
    await i18n.changeLanguage('en');
  });

  it('renders nothing without a notice', () => {
    seed({ achievementNotice: null });
    render(<AchievementNoticeOverlay />);

    expect(screen.queryByTestId('achievement-notice-overlay')).not.toBeInTheDocument();
  });

  it('shows a new Relentless medal as a dialog with its rule and confetti', () => {
    seed({ achievementNotice: [bronze] });
    render(<AchievementNoticeOverlay />);

    expect(screen.getByRole('dialog', { name: 'New achievement!' })).toBeInTheDocument();
    expect(screen.getByTestId('achievement-notice-weekly-streak-bronze')).toHaveTextContent('Relentless Bronze!');
    expect(screen.getByText('Practise at least 3 days a week, 3 weeks in a row')).toBeInTheDocument();
    expect(screen.getByTestId('achievement-confetti')).toBeInTheDocument();
    expect(screen.getByTestId('achievement-notice-dismiss')).toHaveFocus();
  });

  it('uses the plural title for several awards', () => {
    seed({ achievementNotice: [bronze, silver] });
    render(<AchievementNoticeOverlay />);

    expect(screen.getByRole('heading', { name: 'New achievements!' })).toBeInTheDocument();
    expect(screen.getByTestId('achievement-notice-weekly-streak-silver')).toHaveTextContent('Relentless Silver!');
  });

  it('hides confetti when stage_confetti is off', () => {
    featureFlagMocks.overrides = { stage_confetti: false };
    seed({ achievementNotice: [bronze] });
    render(<AchievementNoticeOverlay />);

    expect(screen.queryByTestId('achievement-confetti')).not.toBeInTheDocument();
  });

  it('waits until the grade notice is dismissed', () => {
    seed({
      achievementNotice: [bronze],
      gradeNotice: { kind: 'promoted', fromGrade: 'trainee', toGrade: 'cadet', operations: [] },
    });
    const { rerender } = render(<AchievementNoticeOverlay />);

    expect(screen.queryByTestId('achievement-notice-overlay')).not.toBeInTheDocument();

    useGameStore.getState().dismissGradeNotice();
    rerender(<AchievementNoticeOverlay />);

    expect(screen.getByTestId('achievement-notice-overlay')).toBeInTheDocument();
  });

  it('dismisses with the button', () => {
    seed({ achievementNotice: [bronze] });
    render(<AchievementNoticeOverlay />);

    fireEvent.click(screen.getByTestId('achievement-notice-dismiss'));

    expect(useGameStore.getState().achievementNotice).toBeNull();
    expect(screen.queryByTestId('achievement-notice-overlay')).not.toBeInTheDocument();
  });

  it.each(['Escape', 'Enter'])('dismisses with %s and ignores other keys', (key) => {
    seed({ achievementNotice: [bronze] });
    render(<AchievementNoticeOverlay />);

    fireEvent.keyDown(window, { key: 'a' });
    expect(useGameStore.getState().achievementNotice).toHaveLength(1);

    fireEvent.keyDown(window, { key });
    expect(useGameStore.getState().achievementNotice).toBeNull();
  });

  it('ignores auto-repeated keys held over from the grade notice', () => {
    seed({ achievementNotice: [bronze] });
    render(<AchievementNoticeOverlay />);

    fireEvent.keyDown(window, { key: 'Enter', repeat: true });

    expect(useGameStore.getState().achievementNotice).toHaveLength(1);
  });

  it('describes the dialog with the praise line', () => {
    seed({ achievementNotice: [bronze] });
    render(<AchievementNoticeOverlay />);

    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Your regular practice is paying off. Keep it up!');
  });

  it('renders in Ukrainian', async () => {
    await i18n.changeLanguage('uk');
    seed({ achievementNotice: [bronze] });
    render(<AchievementNoticeOverlay />);

    expect(screen.getByRole('heading', { name: 'Нове досягнення!' })).toBeInTheDocument();
    expect(screen.getByTestId('achievement-notice-weekly-streak-bronze')).toHaveTextContent('Незламний: бронза!');
  });

  it.each([
    ['weekly-goal-met' as const, '🎯', 'Goal Met!', 'Weekly goal reached'],
    ['personal-best-week' as const, '📈', 'Personal Best Week!', 'You beat your usual week'],
    ['focus-of-the-week' as const, '🔍', 'Focus of the Week!', '3 accurate practice runs: Multiplication (*)'],
  ])('shows %s with its icon, title and rule', (id, icon, title, rule) => {
    seed({ achievementNotice: [{ id, earnedAt: 1, weekKey: '2026-W46', operation: '*' }] });
    render(<AchievementNoticeOverlay />);

    expect(screen.getByTestId(`achievement-notice-${id}`)).toHaveTextContent(`${icon}${title}${rule}`);
  });

  it('falls back to the raw id and a generic icon for awards without display text yet', () => {
    seed({ achievementNotice: [{ id: 'mastery-add', earnedAt: 1, operation: '+' }] });
    render(<AchievementNoticeOverlay />);

    expect(screen.getByTestId('achievement-notice-mastery-add')).toHaveTextContent('🏅mastery-add');
  });
});
