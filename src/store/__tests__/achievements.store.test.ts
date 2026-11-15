/**
 * Store tests for saved awards: checks after each run, the silent check on login,
 * and the v5 → v6 migration.
 */
import type { GameHistoryEntry } from '@shared/types';

import { activeWeek, at, makeRun, mondayWeeksBefore } from '../selectors/__tests__/achievementTestUtils';
import type { PlayerProfile } from '../types';
import { useGameStore } from '../useGameStore';

// Wednesday 11 Nov 2026; the week starts on Monday 9 Nov.
const MONDAY = at(2026, 11, 9);
const NOW = at(2026, 11, 11, 18);

const profile = (overrides: Partial<PlayerProfile> = {}): PlayerProfile => ({
  username: 'PilotOne',
  password: 'Abc12345',
  bestScore: 0,
  highestStage: 1,
  preferredGrade: 'trainee',
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

/** Two complete streak weeks plus Mon and Tue of this week. */
function historyOneDayShortOfBronze(): GameHistoryEntry[] {
  return [
    ...activeWeek(mondayWeeksBefore(MONDAY, 2)),
    ...activeWeek(mondayWeeksBefore(MONDAY, 1)),
    ...activeWeek(MONDAY, [0, 1]),
  ];
}

function seed(history: GameHistoryEntry[], overrides: Partial<PlayerProfile> = {}, activeUsername: string | null = 'PilotOne') {
  useGameStore.setState({
    phase: 'playing',
    activeUsername,
    rememberedUsername: null,
    profiles: { PilotOne: profile(overrides) },
    gameHistoryByProfile: { PilotOne: history },
    gradeNotice: null,
    achievementNotice: null,
    stage: 1,
  });
}

describe('achievements in the store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('after a run', () => {
    it('saves Relentless Bronze with earnedAt and weekKey when a run makes the 3rd active day', () => {
      seed(historyOneDayShortOfBronze());

      useGameStore.getState().addGameHistory(makeRun(at(2026, 11, 11, 17)));

      const { profiles, achievementNotice } = useGameStore.getState();
      const bronze = { id: 'weekly-streak-bronze', earnedAt: at(2026, 11, 11, 17), weekKey: '2026-W46' };
      expect(profiles.PilotOne.achievements).toEqual([bronze]);
      expect(achievementNotice).toEqual([bronze]);
    });

    it('does nothing when the run does not complete a tier', () => {
      seed(historyOneDayShortOfBronze());

      useGameStore.getState().addGameHistory(makeRun(at(2026, 11, 10, 17)));

      expect(useGameStore.getState().profiles.PilotOne.achievements).toBeUndefined();
      expect(useGameStore.getState().achievementNotice).toBeNull();
    });

    it('does not save or announce a tier that is already saved', () => {
      seed(historyOneDayShortOfBronze(), {
        achievements: [{ id: 'weekly-streak-bronze', earnedAt: 5, weekKey: '2026-W20' }],
      });

      useGameStore.getState().addGameHistory(makeRun(at(2026, 11, 11, 17)));

      expect(useGameStore.getState().profiles.PilotOne.achievements).toHaveLength(1);
      expect(useGameStore.getState().achievementNotice).toBeNull();
    });

    it('awards Silver at 6 weeks and Gold at 12', () => {
      const history = Array.from({ length: 11 }, (_, index) => activeWeek(mondayWeeksBefore(MONDAY, index + 1))).flat();
      seed([...history, ...activeWeek(MONDAY, [0, 1])]);

      useGameStore.getState().addGameHistory(makeRun(at(2026, 11, 11, 17)));

      expect(useGameStore.getState().profiles.PilotOne.achievements?.map((item) => item.id)).toEqual([
        'weekly-streak-bronze',
        'weekly-streak-silver',
        'weekly-streak-gold',
      ]);
    });

    it('checks awards the same way when a run ends early', () => {
      seed(historyOneDayShortOfBronze());

      useGameStore.getState().persistPrematureGameEnd({
        grade: 'trainee',
        score: 300,
        stage: 2,
        historyEntry: makeRun(at(2026, 11, 11, 17)),
      });

      const { profiles, achievementNotice } = useGameStore.getState();
      expect(profiles.PilotOne.achievements?.[0].id).toBe('weekly-streak-bronze');
      expect(profiles.PilotOne.bestScore).toBe(300);
      expect(achievementNotice).toHaveLength(1);
    });

    it('keeps an undismissed notice and adds new awards to it', () => {
      seed(historyOneDayShortOfBronze());
      useGameStore.setState({ achievementNotice: [{ id: 'mastery-add', earnedAt: 1, operation: '+' }] });

      useGameStore.getState().addGameHistory(makeRun(at(2026, 11, 11, 17)));

      expect(useGameStore.getState().achievementNotice?.map((item) => item.id)).toEqual(['mastery-add', 'weekly-streak-bronze']);
    });

    it('never saves awards or shows a notice for guests', () => {
      useGameStore.setState({
        activeUsername: null,
        profiles: {},
        gameHistoryByProfile: { __guest__: historyOneDayShortOfBronze() },
        achievementNotice: null,
      });

      useGameStore.getState().addGameHistory(makeRun(at(2026, 11, 11, 17)));

      expect(useGameStore.getState().achievementNotice).toBeNull();
      expect(useGameStore.getState().profiles).toEqual({});
    });

    it('keeps saved awards through showGameOver', () => {
      seed(historyOneDayShortOfBronze());
      useGameStore.getState().addGameHistory(makeRun(at(2026, 11, 11, 17)));

      useGameStore.getState().showGameOver({ score: 400, correctCount: 10, incorrectCount: 0, finalPerfScore: 100 });

      expect(useGameStore.getState().profiles.PilotOne.achievements).toHaveLength(1);
      expect(useGameStore.getState().profiles.PilotOne.bestScore).toBe(400);
    });

    it('dismisses the notice, keeps it on the menu, and clears it when a new run starts', () => {
      useGameStore.setState({ achievementNotice: [{ id: 'weekly-streak-bronze', earnedAt: 1, weekKey: '2026-W46' }] });

      useGameStore.getState().openMenu();
      expect(useGameStore.getState().achievementNotice).toHaveLength(1);

      useGameStore.getState().dismissAchievementNotice();
      expect(useGameStore.getState().achievementNotice).toBeNull();

      useGameStore.setState({ achievementNotice: [{ id: 'weekly-streak-bronze', earnedAt: 1, weekKey: '2026-W46' }] });
      useGameStore.getState().startPlaying();
      expect(useGameStore.getState().achievementNotice).toBeNull();
    });
  });

  describe('silent check on login', () => {
    const threeWeeks = () => [
      ...activeWeek(mondayWeeksBefore(MONDAY, 6)),
      ...activeWeek(mondayWeeksBefore(MONDAY, 5)),
      ...activeWeek(mondayWeeksBefore(MONDAY, 4)),
    ];

    it('backfills earned medals without a notice on login, dated when the week qualified', () => {
      seed(threeWeeks(), {}, null);

      expect(useGameStore.getState().loginProfile('PilotOne', 'Abc12345', false)).toEqual({ success: true });

      const [bronze] = useGameStore.getState().profiles.PilotOne.achievements ?? [];
      expect(bronze).toEqual({ id: 'weekly-streak-bronze', earnedAt: at(2026, 10, 14), weekKey: '2026-W42' });
      expect(useGameStore.getState().achievementNotice).toBeNull();
    });

    it('backfills on profile select and on restoring a remembered profile', () => {
      seed(threeWeeks(), {}, null);
      useGameStore.getState().selectProfileByUsername('PilotOne');
      expect(useGameStore.getState().profiles.PilotOne.achievements).toHaveLength(1);

      seed(threeWeeks(), {}, null);
      useGameStore.setState({ rememberedUsername: 'PilotOne' });
      useGameStore.getState().markBootReady();
      expect(useGameStore.getState().profiles.PilotOne.achievements).toHaveLength(1);
      expect(useGameStore.getState().achievementNotice).toBeNull();
    });

    it('leaves profiles untouched when there is nothing to backfill', () => {
      seed([], {}, null);
      const before = useGameStore.getState().profiles;

      useGameStore.getState().selectProfileByUsername('PilotOne');

      expect(useGameStore.getState().profiles).toBe(before);
    });

    it('runs for newly created profiles without error', () => {
      useGameStore.setState({ profiles: {}, gameHistoryByProfile: {}, activeUsername: null });

      expect(useGameStore.getState().createAndLoginSimpleProfile('Newbie')).toEqual({ success: true });
      expect(useGameStore.getState().createAndLoginProfile('Second', 'Abc12345')).toEqual({ success: true });
      expect(useGameStore.getState().profiles.Newbie.achievements).toBeUndefined();
    });
  });

  describe('v5 → v6 migration', () => {
    it('sets achievements to an empty list and keeps existing fields', () => {
      const migrate = useGameStore.persist.getOptions().migrate;
      const v5State = {
        profiles: {
          PilotOne: {
            username: 'PilotOne',
            password: 'enc',
            avatarId: 'avatar-2',
            bestScore: 900,
            highestStage: 7,
            preferredGrade: 'cadet',
            lastPracticeOperation: '*',
            createdAt: 10,
            updatedAt: 20,
          },
        },
        gameHistoryByProfile: {},
        rememberedUsername: 'PilotOne',
      };

      const migrated = migrate?.(v5State, 5) as { profiles: Record<string, PlayerProfile>; rememberedUsername: string };

      expect(useGameStore.persist.getOptions().version).toBe(6);
      expect(migrated.profiles.PilotOne).toEqual({ ...v5State.profiles.PilotOne, achievements: [] });
      expect(migrated.rememberedUsername).toBe('PilotOne');
    });
  });
});
