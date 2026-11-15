import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { activeWeek, at, mondayWeeksBefore } from '@store/selectors/__tests__/achievementTestUtils';
import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import type { GameHistoryEntry } from '@shared/types';

import i18n from '../../../../i18n/config';
import baseStoreState from '../../__mocks__/base-store-state.json';
import { AchievementsOverlay } from '..';

// Thursday 12 Nov 2026; the week starts on Monday 9 Nov.
const NOW = at(2026, 11, 12);
const MONDAY = at(2026, 11, 9);

const profile = {
  username: 'AcePilot',
  password: 'x',
  bestScore: 0,
  highestStage: 1,
  preferredGrade: 'trainee' as const,
  createdAt: 1,
  updatedAt: 1,
};

function seed(history: GameHistoryEntry[], { guest = false }: { guest?: boolean } = {}) {
  useGameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    phase: 'start',
    screenView: 'achievements',
    activeUsername: guest ? null : 'AcePilot',
    profiles: guest ? {} : { AcePilot: profile },
    gameHistoryByProfile: { [guest ? '__guest__' : 'AcePilot']: history },
  });
}

describe('AchievementsOverlay', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('shows an empty streak with all day dots inactive', () => {
    seed([]);
    render(<AchievementsOverlay now={NOW} />);

    expect(screen.getByTestId('achievements-streak-weeks')).toHaveTextContent('0 weeks in a row');
    expect(screen.getByTestId('achievements-streak-next')).toHaveTextContent('Next: Relentless Bronze (3 weeks)');
    expect(screen.getByTestId('achievements-streak-status')).toHaveTextContent('3 more days needed this week');
    expect(screen.getByText('Practise at least 3 days a week, 3 weeks in a row')).toBeInTheDocument();
    expect(screen.queryByTestId('achievements-guest-hint')).not.toBeInTheDocument();
  });

  it('marks Monday and Wednesday active and asks for one more day', () => {
    seed(activeWeek(MONDAY, [0, 2]));
    render(<AchievementsOverlay now={NOW} />);

    const dots = within(screen.getByTestId('achievements-day-dots'));
    expect(dots.getByRole('img', { name: 'Monday, active' })).toHaveClass('achievements-day__dot--active');
    expect(dots.getByRole('img', { name: 'Tuesday, not active' })).not.toHaveClass('achievements-day__dot--active');
    expect(dots.getByRole('img', { name: 'Wednesday, active' })).toBeInTheDocument();
    expect(dots.getByRole('img', { name: 'Thursday (today), not active' })).toHaveClass('achievements-day__dot--today');
    expect(screen.getByTestId('achievements-streak-status')).toHaveTextContent('1 more day needed this week');
  });

  it('shows a two-week streak with progress toward Relentless Bronze', () => {
    seed([
      ...activeWeek(mondayWeeksBefore(MONDAY, 2)),
      ...activeWeek(mondayWeeksBefore(MONDAY, 1)),
    ]);
    render(<AchievementsOverlay now={NOW} />);

    expect(screen.getByTestId('achievements-streak-weeks')).toHaveTextContent('2 weeks in a row');
    expect(screen.getByTestId('achievements-streak-next')).toHaveTextContent('Next: Relentless Bronze (3 weeks)');
  });

  it('confirms the week once three days are active', () => {
    seed(activeWeek(MONDAY, [0, 1, 2]));
    render(<AchievementsOverlay now={NOW} />);

    expect(screen.getByTestId('achievements-streak-status')).toHaveTextContent('This week counts toward your streak!');
  });

  it('says every tier is reached after twelve weeks', () => {
    seed(Array.from({ length: 12 }, (_, index) => activeWeek(mondayWeeksBefore(MONDAY, index + 1))).flat());
    render(<AchievementsOverlay now={NOW} />);

    expect(screen.getByTestId('achievements-streak-weeks')).toHaveTextContent('12 weeks in a row');
    expect(screen.getByTestId('achievements-streak-next')).toHaveTextContent('Every Relentless tier reached');
  });

  it('works out a guest streak and explains that awards are not saved', () => {
    seed(activeWeek(MONDAY, [0]), { guest: true });
    render(<AchievementsOverlay now={NOW} />);

    expect(screen.getByRole('heading', { name: 'Ghost' })).toBeInTheDocument();
    expect(screen.getByTestId('achievements-guest-hint')).toHaveTextContent('Awards are saved only for named profiles');
    expect(screen.getByTestId('achievements-streak-status')).toHaveTextContent('2 more days needed this week');
  });

  it('renders in Ukrainian with the medal name and tier word', async () => {
    await i18n.changeLanguage('uk');
    seed([...activeWeek(mondayWeeksBefore(MONDAY, 1))]);
    render(<AchievementsOverlay now={NOW} />);

    expect(screen.getByTestId('achievements-streak-weeks')).toHaveTextContent('1 тиждень поспіль');
    expect(screen.getByTestId('achievements-streak-next')).toHaveTextContent('Далі — Незламний: бронза (3 тижні)');
    expect(screen.getByText('Тренуйся щонайменше 3 дні на тиждень, 3 тижні поспіль')).toBeInTheDocument();
  });

  it('falls back to the time the screen opened when no reference time is given', () => {
    seed([]);
    render(<AchievementsOverlay />);

    expect(screen.getByTestId('achievements-day-dots').children).toHaveLength(7);
  });
});

describe('achievement plurals', () => {
  it.each([
    ['en', 1, '1 week in a row'],
    ['en', 3, '3 weeks in a row'],
    ['en', 6, '6 weeks in a row'],
    ['en', 12, '12 weeks in a row'],
    ['uk', 1, '1 тиждень поспіль'],
    ['uk', 3, '3 тижні поспіль'],
    ['uk', 6, '6 тижнів поспіль'],
    ['uk', 12, '12 тижнів поспіль'],
  ])('%s weeksInARow %i', async (language, count, expected) => {
    await i18n.changeLanguage(language);
    expect(i18n.t('achievements.streak.weeksInARow', { count })).toBe(expected);
  });

  it.each([
    ['en', 3, 'bronze', 'Next: Relentless Bronze (3 weeks)'],
    ['en', 6, 'silver', 'Next: Relentless Silver (6 weeks)'],
    ['en', 12, 'gold', 'Next: Relentless Gold (12 weeks)'],
    ['uk', 3, 'bronze', 'Далі — Незламний: бронза (3 тижні)'],
    ['uk', 6, 'silver', 'Далі — Незламний: срібло (6 тижнів)'],
    ['uk', 12, 'gold', 'Далі — Незламний: золото (12 тижнів)'],
  ])('%s next %i', async (language, count, tier, expected) => {
    await i18n.changeLanguage(language);
    expect(i18n.t('achievements.streak.next', { count, tier: i18n.t(`achievements.relentless.tierWord.${tier}`) })).toBe(expected);
  });

  it.each([
    ['en', 1, '1 more day needed this week'],
    ['en', 2, '2 more days needed this week'],
    ['en', 5, '5 more days needed this week'],
    ['uk', 1, 'Потрібно ще 1 день цього тижня'],
    ['uk', 2, 'Потрібно ще 2 дні цього тижня'],
    ['uk', 5, 'Потрібно ще 5 днів цього тижня'],
  ])('%s daysNeeded %i', async (language, count, expected) => {
    await i18n.changeLanguage(language);
    expect(i18n.t('achievements.streak.daysNeeded', { count })).toBe(expected);
  });
});
