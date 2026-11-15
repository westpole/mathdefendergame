import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { activeWeek, at, makeRun, mondayWeeksBefore } from '@store/selectors/__tests__/achievementTestUtils';
import { useGameStore } from '@store/useGameStore';
import type { GameStoreState } from '@store/types';
import type { EarnedAchievement, GameHistoryEntry } from '@shared/types';

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

function seed(
  history: GameHistoryEntry[],
  {
    guest = false,
    achievements,
    weeklyScoreGoal,
  }: { guest?: boolean; achievements?: EarnedAchievement[]; weeklyScoreGoal?: number } = {},
) {
  useGameStore.setState({
    ...(structuredClone(baseStoreState) as Partial<GameStoreState>),
    phase: 'start',
    screenView: 'achievements',
    activeUsername: guest ? null : 'AcePilot',
    profiles: guest ? {} : { AcePilot: { ...profile, ...(achievements && { achievements }), ...(weeklyScoreGoal && { weeklyScoreGoal }) } },
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
    expect(within(screen.getByTestId('achievements-streak-card')).getByText('Practise at least 3 days a week, 3 weeks in a row')).toBeInTheDocument();
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
    expect(within(screen.getByTestId('achievements-streak-card')).getByText('Тренуйся щонайменше 3 дні на тиждень, 3 тижні поспіль')).toBeInTheDocument();
  });

  it('shows three locked Relentless medals with their requirements', () => {
    seed([]);
    render(<AchievementsOverlay now={NOW} />);

    expect(screen.getByRole('heading', { name: 'Relentless' })).toBeInTheDocument();
    expect(screen.getByTestId('achievements-medal-bronze')).toHaveTextContent('Relentless Bronze');
    expect(screen.getByTestId('achievements-medal-bronze')).toHaveTextContent('Locked: 3 weeks in a row');
    expect(screen.getByTestId('achievements-medal-silver')).toHaveTextContent('6 weeks in a row');
    expect(screen.getByTestId('achievements-medal-gold')).toHaveTextContent('12 weeks in a row');
    expect(screen.getByTestId('achievements-medal-gold')).toHaveClass('achievements-medal--locked');
  });

  it('unlocks a saved medal with its earned date', () => {
    const earnedAt = at(2026, 10, 14);
    seed([], { achievements: [{ id: 'weekly-streak-bronze', earnedAt, weekKey: '2026-W42' }] });
    render(<AchievementsOverlay now={NOW} />);

    const expectedDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(earnedAt);
    expect(screen.getByTestId('achievements-medal-bronze')).not.toHaveClass('achievements-medal--locked');
    expect(screen.getByTestId('achievements-medal-bronze')).toHaveTextContent(`Earned ${expectedDate}`);
    expect(screen.getByTestId('achievements-medal-silver')).toHaveClass('achievements-medal--locked');
  });

  it('shows medals a guest history earns without saving them', () => {
    seed(Array.from({ length: 3 }, (_, index) => activeWeek(mondayWeeksBefore(MONDAY, index + 1))).flat(), { guest: true });
    render(<AchievementsOverlay now={NOW} />);

    expect(screen.getByTestId('achievements-medal-bronze')).not.toHaveClass('achievements-medal--locked');
    expect(useGameStore.getState().profiles).toEqual({});
  });

  it('shows Ukrainian medal names and requirements', async () => {
    await i18n.changeLanguage('uk');
    seed([]);
    render(<AchievementsOverlay now={NOW} />);

    expect(screen.getByTestId('achievements-medal-bronze')).toHaveTextContent('Незламний: бронза');
    expect(screen.getByTestId('achievements-medal-bronze')).toHaveTextContent('3 тижні поспіль');
    expect(screen.getByTestId('achievements-medal-silver')).toHaveTextContent('6 тижнів поспіль');
    expect(screen.getByTestId('achievements-medal-gold')).toHaveTextContent('Незламний: золото');
  });

  it('shows a banked streak shield with its tooltip', () => {
    seed(Array.from({ length: 4 }, (_, index) => activeWeek(mondayWeeksBefore(MONDAY, index + 1))).flat());
    render(<AchievementsOverlay now={NOW} />);

    const shield = screen.getByRole('img', { name: 'Streak Shield: One missed week will be forgiven' });
    expect(shield).toHaveAttribute('title', 'One missed week will be forgiven');
    expect(screen.getByTestId('achievements-shield-note')).toHaveTextContent('One missed week will be forgiven');
    expect(screen.queryByTestId('achievements-streak-risk')).not.toBeInTheDocument();
  });

  it('warns that the streak is at risk on Saturday without a shield', () => {
    seed([...activeWeek(mondayWeeksBefore(MONDAY, 1)), ...activeWeek(MONDAY, [0])]);
    render(<AchievementsOverlay now={at(2026, 11, 14)} />);

    expect(screen.getByTestId('achievements-streak-risk')).toHaveTextContent('Streak at risk');
    expect(screen.queryByTestId('achievements-shield')).not.toBeInTheDocument();
  });

  it('says the shield will protect an at-risk streak', () => {
    seed(Array.from({ length: 4 }, (_, index) => activeWeek(mondayWeeksBefore(MONDAY, index + 1))).flat());
    render(<AchievementsOverlay now={at(2026, 11, 14)} />);

    expect(screen.getByTestId('achievements-streak-risk')).toHaveTextContent('Your shield will protect your streak');
    expect(screen.getByTestId('achievements-streak-risk')).toHaveClass('achievements-risk--shielded');
  });

  it('marks last week as protected when a shield covered it', () => {
    seed([
      ...Array.from({ length: 4 }, (_, index) => activeWeek(mondayWeeksBefore(MONDAY, index + 2))).flat(),
      ...activeWeek(mondayWeeksBefore(MONDAY, 1), [0]),
    ]);
    render(<AchievementsOverlay now={NOW} />);

    expect(screen.getByTestId('achievements-week-shielded')).toHaveTextContent('Last week: Week protected by shield');
    expect(screen.getByTestId('achievements-streak-weeks')).toHaveTextContent('4 weeks in a row');
  });

  it('shows shield and risk text in Ukrainian', async () => {
    await i18n.changeLanguage('uk');
    seed(Array.from({ length: 4 }, (_, index) => activeWeek(mondayWeeksBefore(MONDAY, index + 1))).flat());
    render(<AchievementsOverlay now={at(2026, 11, 14)} />);

    expect(screen.getByRole('img', { name: 'Щит серії: Один пропущений тиждень не зламає серію' })).toBeInTheDocument();
    expect(screen.getByTestId('achievements-streak-risk')).toHaveTextContent('Щит збереже твою серію');
  });

  describe('goal card', () => {
    const goalRun = (playedAt: number, finalScore: number, correctAnswers = 17, incorrectAnswers = 3) => (
      makeRun(playedAt, { finalScore, correctAnswers, incorrectAnswers })
    );

    it('prompts to set a goal with a link to Settings when the goal is off', () => {
      seed([]);
      render(<AchievementsOverlay now={NOW} />);

      expect(screen.getByTestId('achievements-goal-empty')).toHaveTextContent('Set a weekly goal');
      fireEvent.click(screen.getByTestId('achievements-goal-open-settings'));

      expect(useGameStore.getState().screenView).toBe('settings');
    });

    it('shows a guest hint instead of the Settings link', () => {
      seed([], { guest: true });
      render(<AchievementsOverlay now={NOW} />);

      expect(screen.getByTestId('achievements-goal-empty')).toHaveTextContent('Create a profile to set a goal');
      expect(screen.queryByTestId('achievements-goal-open-settings')).not.toBeInTheDocument();
    });

    it('starts at 0%', () => {
      seed([], { weeklyScoreGoal: 1000 });
      render(<AchievementsOverlay now={NOW} />);

      expect(screen.getByRole('progressbar', { name: 'Weekly goal progress' })).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByTestId('goal-progress-value')).toHaveTextContent('0 / 1,000');
    });

    it('shows partial progress from qualifying runs and ignores the rest', () => {
      seed([
        goalRun(at(2026, 11, 9), 200),
        goalRun(at(2026, 11, 10), 300),
        goalRun(at(2026, 11, 11), 900, 849, 151),
      ], { weeklyScoreGoal: 1000 });
      render(<AchievementsOverlay now={NOW} />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
      expect(screen.getByTestId('goal-progress-value')).toHaveTextContent('500 / 1,000');
      expect(screen.getByTestId('goal-progress-non-qualifying')).toHaveTextContent('1 run this week did not count');
    });

    it('shows today capped at 40% of the goal', () => {
      seed([goalRun(at(2026, 11, 12, 9), 700)], { weeklyScoreGoal: 1000 });
      render(<AchievementsOverlay now={NOW} />);

      expect(screen.getByTestId('goal-progress-value')).toHaveTextContent('400 / 1,000');
      expect(screen.getByTestId('goal-progress-today')).toHaveTextContent('+400 today (max 400)');
    });

    it('celebrates a met goal', () => {
      seed([0, 1, 2].map((day) => goalRun(at(2026, 11, 9 + day), 200)), { weeklyScoreGoal: 500 });
      render(<AchievementsOverlay now={NOW} />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
      expect(screen.getByTestId('goal-progress-met')).toHaveTextContent('Weekly goal reached!');
    });

    it('renders the goal card in Ukrainian', async () => {
      await i18n.changeLanguage('uk');
      seed([goalRun(at(2026, 11, 12, 9), 200), goalRun(at(2026, 11, 12, 10), 200, 5, 5)], { weeklyScoreGoal: 1000 });
      render(<AchievementsOverlay now={NOW} />);

      expect(screen.getByRole('heading', { name: 'Тижнева ціль' })).toBeInTheDocument();
      expect(screen.getByTestId('goal-progress-today')).toHaveTextContent('+200 сьогодні (макс. 400)');
      expect(screen.getByTestId('goal-progress-non-qualifying')).toHaveTextContent('1 забіг цього тижня не зараховано');
    });
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
    ['en', 3, '3 weeks in a row'],
    ['en', 6, '6 weeks in a row'],
    ['en', 12, '12 weeks in a row'],
    ['uk', 3, '3 тижні поспіль'],
    ['uk', 6, '6 тижнів поспіль'],
    ['uk', 12, '12 тижнів поспіль'],
  ])('%s relentless.requirement %i', async (language, count, expected) => {
    await i18n.changeLanguage(language);
    expect(i18n.t('achievements.relentless.requirement', { count })).toBe(expected);
  });

  it.each([
    ['en', 'bronze', 'Relentless Bronze!'],
    ['uk', 'gold', 'Незламний: золото!'],
  ])('%s relentless.earned %s', async (language, tier, expected) => {
    await i18n.changeLanguage(language);
    expect(i18n.t('achievements.relentless.earned', { tier: i18n.t(`achievements.relentless.tierWord.${tier}`) })).toBe(expected);
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
