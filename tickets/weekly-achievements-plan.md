# Plan: Relentless medal, Achievements page, weekly accuracy goal

> This file is the **batch tracker and design reference** for this batch. It and the ticket files are temporary. They are committed at the start of the batch and removed in its last commit on the branch (see [Workflow](#workflow), steps 0 and 9). [README.md](./README.md) is the permanent template and is not edited for a batch.

## Batch tracker

> **Dev branch:** `25-idea-add-medals` (the existing feature branch; no separate dev branch or ticket branches for this batch)
> **Batch issue:** #25 (idea add medals). Every commit in this batch references `#25`.
> **Ticket IDs:** 151–157 are **local ticket IDs only**, not GitHub issues. Never write them as `#151` in commits or PRs, because GitHub would link them to unrelated issues or PRs.
> **Batch status:** In Progress

### Starting point

- History is saved for each profile, without a limit, in `gameHistoryByProfile` (`src/store/useGameStore.ts`, persist v5). Each `GameHistoryEntry` has `playedAt`, correct/incorrect counts, `finalScore`, `mostProblematicOperation`, `operationStats` and `mode`.
- `WeeklyReportOverlay` shows rolling 7-day stats (`buildWeeklyProgressReport` in `src/store/selectors/progress.ts`). There is no calendar-week logic.
- `SettingsOverlay` only edits the avatar. The `Select` component exists (`src/ui/components/Select`).
- There are no achievements, streaks or goals yet. `ScreenView` has no `achievements` view.
- Constraint: all new rules live in the Zustand store and selectors. `src/game/main.ts` and `GameScene` don't change.

### Workflow

> Workflow for this batch. There is one developer, one ticket in progress at a time, and every commit goes on the existing feature branch.

0. **Once, before the first ticket:** commit this plan and the ticket files on their own as `docs: #25 add weekly achievements plan and tickets`. They have to be in git so each ticket's commit can include its status change. Set **Batch status** to `In Progress` in the same commit.
1. Check that you're on `25-idea-add-medals` and that it is up to date (see [Syncing with master](#branch-and-merge-rules)).
2. Pick the **lowest-numbered** ticket in the [Tickets](#tickets) table whose status is `Ready for Dev`. Every blocker has a lower number, so its **Blocked by** tickets are already `Done`.
3. Set its status to `In Progress` in the ticket file and the table. Don't commit this on its own.
4. Implement the ticket in its owning layer (see `CLAUDE.md` → Code Ownership), and add or update tests and stories.
5. Run verification locally. CI runs only on PRs to `master`, so the local run is the gate:
   `npm run typecheck`, `npm run lint`, the narrowest test lane, then `npm run test:all` if the change is cross-cutting.
   Skip e2e (`npm run test:e2e*`) for now, because it needs a Docker image that matches the CI environment.
6. Run the `code-reviewer` subagent and address its findings.
7. Set the ticket's status to `Done` in the ticket file and the table. Then make **one commit** that holds the code, the tests, the stories and the status change:
   `<type>: #25 <description> (ticket <id>)`, for example `feat: #25 add achievements page with weekly streak progress (ticket 151)`.
8. Repeat from step 1 until every ticket is `Done`.
9. **Clean up on the branch:** make a final commit `chore: #25 remove temporary weekly achievements tracker` that deletes this plan and the ticket files `151-*.md` to `157-*.md`. `tickets/README.md` stays unchanged. The docs remain in branch history.
10. Open the PR to `master` (see below).

### Branch and merge rules

- **Branch:** all commits go directly on `25-idea-add-medals`. Don't create a dev branch or ticket branches, and don't squash.
- **Ticket IDs in git and GitHub text:** write local ticket IDs as `ticket 151`, never `#151`, in commit messages and in the PR title and description. Only `#25` is a real issue.
- **Syncing with master:** `master` rarely moves while the batch is in progress. If it does, merge `master` into `25-idea-add-medals` before starting the next ticket. Don't rebase.
- **PR to master:** open one PR from `25-idea-add-medals` to `master`. This is where CI runs.
  - Title: `feat: #25 relentless medal, achievements page and weekly goal`.
  - Description: summarise the batch and list the tickets as `ticket 151` … `ticket 157`, each with its title.
  - Merge with a **merge commit** (no squash, no rebase), so each ticket's commit stays in `master` history.
- **After the merge:** delete `25-idea-add-medals`. There are no extra commits on `master`, because the temporary docs were already removed on the branch (step 9).

### Exceptions

> Cases where the agent must stop and ask instead of proceeding.

- A ticket requires changing the Electron security posture (`contextIsolation`, `nodeIntegration`).
- Acceptance criteria are ambiguous or contradict another ticket or the plan.
- A dependency upgrade or release is needed (`/npm-upgrade`, `/release-workflow` are user-invoked only).
- `25-idea-add-medals` is behind `master` and merging `master` into it produces conflicts.
- The current branch is not `25-idea-add-medals`.
- A ticket would need changes to the `GameHistoryEntry` schema or to `src/game/main.ts` gameplay rules.
- A ticket would need a persist version bump beyond v6 (only #152 bumps the version).

### Definition of done

> Applies to the batch as a whole. Each ticket also has its own Definition of Done (section 7 of the ticket template).

- [ ] All tickets in the table are `Done`, each as one `#25` commit on `25-idea-add-medals`
- [ ] `npm run typecheck`, `npm run lint`, and `npm run test:all` pass locally on `25-idea-add-medals`
- [ ] `25-idea-add-medals` → `master` PR is green in CI and merged with a merge commit
- [ ] Desktop and mobile stories exist for any changed UI
- [ ] Documentation updated where behavior changed (`src/store/README.md` achievements contract)
- [ ] `achievements` feature flag hides every new UI surface when off
- [ ] i18n keys complete for `en` and `uk`

### Tickets

> - One row per ticket. Ticket files live next to this plan as `tickets/<number>-<short-slug>.md`
>   and follow [docs/AgileTicketTemplate.md](../docs/AgileTicketTemplate.md).
> - Link the **Ticket** cell to the ticket file.
> - **Type:** Feature / Bug / Chore / Refactor / Test / Docs / Spike
> - **Priority:** P0 (critical) / P1 (high) / P2 (medium) / P3 (low)
> - **Size:** XS / S / M / L / XL
> - **Status:** Draft / Ready for Dev / In Progress / In Review / Done — must match the ticket file's header.
> - **Blocked by:** comma-separated ticket numbers, or `—` if none.

| Ticket | Title | Type | Priority | Size | Status | Blocked by |
| --- | --- | --- | --- | --- | --- | --- |
| [#151](./151-achievements-page-weekly-streak.md) | Achievements page with live weekly streak progress | Feature | P1 | M | Ready for Dev | — |
| [#152](./152-earn-weekly-streak-medals.md) | Earn and keep the Relentless medal | Feature | P1 | M | Ready for Dev | 151 |
| [#153](./153-streak-shield.md) | Streak shield protects one missed week | Feature | P2 | S | Ready for Dev | 152 |
| [#154](./154-weekly-accuracy-goal.md) | Weekly accuracy goal: set in Settings, track progress | Feature | P1 | L | Ready for Dev | 151, 152 |
| [#155](./155-goal-met-personal-best-badges.md) | Goal Met and Personal Best Week badges, plus suggested goal | Feature | P2 | M | Ready for Dev | 152, 154 |
| [#156](./156-focus-of-the-week-badge.md) | Focus of the Week badge for the weakest operation | Feature | P2 | M | Ready for Dev | 152, 155 |
| [#157](./157-operation-mastery-badges.md) | Operation mastery badges (accuracy and speed) | Feature | P2 | M | Ready for Dev | 152, 155 |

Order: ticket-number order, 151 → 152 → 153 → 154 → 155 → 156 → 157 (see [Workflow](#workflow)). Each ticket is a vertical slice that ships something the player can see, from store to UI, with its own tests and stories.

### Expected end state

- **Player-facing:**
  - A menu entry opens the **Achievements** page. It shows the streak card (weeks in a row, Mon to Sun day dots, shield, at-risk warning), the Relentless Bronze/Silver/Gold medal shelf, the weekly goal card, and a badge grid (Goal Met ×N, Personal Best Week, Focus of the Week, four Mastery tiles).
  - **Settings** has a weekly goal (Off, Suggested, or presets). Only runs with 85% accuracy or higher count, and at most 40% of the goal counts per day.
  - **Game Over** says whether the run counted toward the goal. A notice celebrates new awards.
  - The **Weekly Report** shows calendar-week goal and streak status.
- **Codebase:**
  - New `src/store/selectors/achievements.ts` (pure, `now` passed in).
  - Profile fields `achievements` and `weeklyScoreGoal`, persist v6.
  - Awards are checked after each saved run and silently on login.
  - New `AchievementsOverlay` and `AchievementNoticeOverlay`. Settings, Game Over, Weekly Report, Practice select and the menu are extended.
  - No changes to Phaser or `main.ts`.
- **Quality:**
  - `test:store` covers week/day boundaries (DST, year rollover), accuracy and cap boundaries, shield, deduplication, backfill and migration.
  - `test:react` covers every overlay state.
  - Desktop and mobile stories exist for every new state. Achievements and Settings have visual snapshots.

---

## Goal

Encourage regular, accurate, spaced math practice:

- The **Relentless** medal for practicing **at least 3 days a week, 3 weeks in a row** (with higher tiers after that).
- An **Achievements** page that shows medals and badges.
- A **weekly goal** in Settings: *score X, counting only runs with 85% accuracy or higher*.

### Naming

The weekly streak medal is called **Relentless**. Players only ever see this name; code keeps the descriptive "weekly streak" names.

| Where | Name |
|---|---|
| English (`en`) | **Relentless**, with tiers **Relentless Bronze / Silver / Gold** |
| Ukrainian (`uk`) | **Незламний**, with tiers **Незламний: бронза / срібло / золото** |
| Streak shield (#153) | English **Streak Shield**, Ukrainian **Щит серії** |
| Code ids and selectors | Unchanged: `weekly-streak-{bronze,silver,gold}`, `computeWeeklyStreak`, `STREAK_TIERS`. The id describes the rule and the name is branding. This also keeps the weekly streak separate from the in-game `streak_reward`. |

The medal name always appears with the subtitle stating the rule ("Practise at least 3 days a week, 3 weeks in a row" / «Тренуйся щонайменше 3 дні на тиждень, 3 тижні поспіль»), so younger players don't need to know the word to understand the goal.

**Ukrainian grammar:** «Незламний» is masculine. Use it as a standalone label or a quoted name («медаль «Незламний»»). Never put the word "медаль" in front of it without quotes, because that would require the feminine «Незламна».

#### i18n keys

| Key | `en` | `uk` | Added in |
|---|---|---|---|
| `achievements.relentless.title` | Relentless | Незламний | #151 |
| `achievements.relentless.subtitle` | Practise at least 3 days a week, 3 weeks in a row | Тренуйся щонайменше 3 дні на тиждень, 3 тижні поспіль | #151 |
| `achievements.relentless.tier.{bronze,silver,gold}` | Relentless Bronze / Silver / Gold | Незламний: бронза / срібло / золото | #151 |
| `achievements.relentless.tierWord.{bronze,silver,gold}` | Bronze / Silver / Gold | бронза / срібло / золото | #151 |
| `achievements.relentless.earned` | Relentless {{tier}}! | Незламний: {{tier}}! | #152 |
| `achievements.streak.weeksInARow` (plural) | {{count}} week(s) in a row | {{count}} тиждень / тижні / тижнів поспіль | #151 |
| `achievements.streak.next` (plural on `count`) | Next: Relentless {{tier}} ({{count}} weeks) | Далі — Незламний: {{tier}} ({{count}} тижні / тижнів) | #151 |
| `achievements.streak.daysNeeded` (plural) | {{count}} more day(s) needed this week | Потрібно ще {{count}} день / дні / днів цього тижня | #151 |
| `achievements.relentless.requirement` (plural) | {{count}} weeks in a row | {{count}} тижні / тижнів поспіль | #152 |
| `achievements.shield.title` | Streak Shield | Щит серії | #153 |
| `achievements.shield.tooltip` | One missed week will be forgiven | Один пропущений тиждень не зламає серію | #153 |
| `achievements.streak.atRisk` | Streak at risk | Серія під загрозою | #153 |
| `achievements.shield.willProtect` | Your shield will protect your streak | Щит збереже твою серію | #153 |
| `achievements.shield.weekShielded` | Week protected by shield | Тиждень захищено щитом | #153 |

`{{tier}}` inside `next` and `earned` is the tier word on its own (`en`: Bronze / Silver / Gold; `uk`: бронза / срібло / золото, lowercase), held in `achievements.relentless.tierWord.{bronze,silver,gold}`. The surrounding key adds the medal name, so the results read "Relentless Bronze" and «Незламний: бронза».

**Which tier key to use:** the medal shelf slot labels use the full names in `tier.*`. Composed strings (`next`, `earned`) use `tierWord.*`. When a tier is renamed, update both sets together.

**Capitalisation:** "Streak Shield" is capitalised only as a UI label. In ticket prose and descriptions it is "streak shield".

**Plurals:** every string that contains a count uses i18next plural suffixes. English uses `_one` and `_other`. Ukrainian uses `_one` (1, 21: «тиждень», «день»), `_few` (2–4, 22–24: «тижні», «дні») and `_many` (5–20, 25+: «тижнів», «днів»), plus `_other` as a fallback. The `uk` `_other` text must repeat the `_many` text, never be left blank. For `relentless.requirement` the count is always 3, 6 or 12, so the `en` `_one` and `_other` hold the same text, and `uk` needs only `_few` and `_many`, plus `_other` = `_many`. Tests must cover 1, 3, 6 and 12 weeks, and 1, 2 and 5 days, in both languages.

## 0. Core rules

All values are constants in `src/store/constants.ts`.

| Rule | Value | Constant |
|---|---|---|
| Week | Calendar week, Monday 00:00 local time, keyed `2026-W46` (ISO week-year) | — |
| Active day | A local day whose saved runs total 10 or more correct answers. A day counts once, however many runs it has. Practice and regular runs both count. | `ACTIVE_DAY_MIN_CORRECT = 10` |
| Streak week | A week with 3 or more active days | `STREAK_MIN_DAYS_PER_WEEK = 3` |
| Relentless medal tiers | Bronze at 3 weeks in a row, Silver at 6, Gold at 12 | `STREAK_TIERS = [3, 6, 12]` |
| Streak shield | Earn 1 for every 4 streak weeks in a row, at most 1 banked. Used up automatically when a week falls short: the streak continues, but the covered week doesn't add to the count. | `SHIELD_EVERY_N_WEEKS = 4`, `SHIELD_MAX_BANKED = 1` |
| Qualifying run | A run with 85% accuracy or higher and at least 10 answers | `GOAL_MIN_ACCURACY = 0.85`, `GOAL_MIN_ANSWERS = 10` |
| Weekly goal | Total score from qualifying runs this week is X or more, after the daily cap | `WEEKLY_GOAL_PRESETS = [500, 1000, 2500, 5000]` |
| Daily goal cap | At most 40% of X counts per day, so meeting the goal takes 3 or more days (the same as a streak week) | `GOAL_DAILY_CAP_RATIO = 0.4` |
| Suggested goal | 4-week baseline × 1.1, rounded to the nearest 50. Hidden with fewer than 2 complete weeks of history. | `GOAL_SUGGESTION_MULTIPLIER = 1.1` |
| Guests | See progress live, but awards are saved only for named profiles | — |

**Why accuracy is checked per run:** the player gets clear feedback on the Game Over screen right away ("counts" or "78%, aim for 85%"). It also stops one careless run from being cancelled out by a few careful ones.

## 1. Shared contracts

**`src/shared/types.ts`**

- `AchievementId`, made up of:
  - `weekly-streak-bronze | weekly-streak-silver | weekly-streak-gold`
  - `weekly-goal-met`
  - `personal-best-week`
  - `focus-of-the-week`
  - `mastery-add | mastery-sub | mastery-mul | mastery-div`
- `EarnedAchievement { id: AchievementId; earnedAt: number; weekKey?: string; operation?: MathOperation }`

**`src/store/types.ts`**

- Add `'achievements'` to `ScreenView`.
- New `PlayerProfile` fields:
  - `weeklyScoreGoal?: number`. If unset, the goal is off.
  - `achievements?: EarnedAchievement[]`
- New transient field `achievementNotice: EarnedAchievement[] | null`. It is not persisted.

Awards are **saved when earned**, so a medal stays earned even if the goal or a rule changes later.
The **streak shield is not saved**. It is worked out from history each time (section 2), so it can never drift out of sync.

## 2. Pure selectors (`src/store/selectors/achievements.ts`)

Each takes `now` as a parameter so it can be tested without real time.

| Selector | Returns |
|---|---|
| `toWeekKey(ts)`, `toDayKey(ts)` | Local-time keys |
| `isQualifyingRun(entry)` | `true` when accuracy is 85% or higher and there are 10 or more answers |
| `buildActiveDaysByWeek(history)` | `Map<weekKey, Set<dayKey>>` |
| `computeWeeklyStreak(history, now)` | `{ streakWeeks, thisWeekActiveDays, daysNeeded, shieldBanked, shieldUsedWeekKeys, atRisk }`. Walks the weeks from oldest to newest, banking and using shields. The current week doesn't break the streak until it is over. |
| `computeWeeklyGoalProgress(history, goal, now)` | `{ creditedScore, goal, percent, met, todayCredited, todayCap, nonQualifyingRuns }` |
| `computeFourWeekBaseline(history, now)` | Average credited score over the last 4 complete weeks, or `null` with fewer than 2 weeks |
| `selectFocusOperation(history, now)` | The most common `mostProblematicOperation` over the last 2 weeks, or `null` |
| `computeOperationMastery(history, op)` | Last 50 attempts from `operationStats`: `{ accuracy, avgTimeMs, mastered }` |
| `evaluateNewAchievements(history, profile, now)` | Only newly earned awards, deduplicated by `id + weekKey` or `id + operation` |

`atRisk` is true from Friday on when `thisWeekActiveDays + remainingDays < 3` would break the streak, or when only one more day is still possible.

## 3. Badge catalog

| Badge | How it's earned | Learning purpose | Repeatable |
|---|---|---|---|
| 🥉🥈🥇 Relentless (Незламний) | 3, 6 or 12 streak weeks in a row | Regular, spaced practice | Each tier once |
| 🎯 Goal Met | Weekly goal met | Accurate practice spread over the week | Once per week (shown as a count) |
| 📈 Personal Best Week | Credited score above the 4-week baseline. If no goal is set, the cap uses the suggested goal. | Comparing with yourself, fair at every skill level | Once per week |
| 🔍 Focus of the Week | 3 qualifying **practice** runs in the focus operation | Targeted work on weak spots | Once per week |
| ⚡ Mastery (+ − × ÷) | Accuracy of 90% or higher and an average time under the threshold over the last 50 attempts | Fluency, not just showing up | Once per operation |

Mastery time thresholds are in `MASTERY_MAX_AVG_MS`: `+`/`-` 3000 ms, `*`/`/` 4000 ms. Accuracy uses `MASTERY_MIN_ACCURACY = 0.9` and the window uses `MASTERY_WINDOW_ATTEMPTS = 50`.

## 4. Store changes

Only Zustand changes. **There are no changes to `src/game/main.ts` or `GameScene`**, because these rules are about progress between runs, not gameplay.

- In `addGameHistory` and `persistPrematureGameEnd`: add the entry, run `evaluateNewAchievements`, append the results to the profile, and set `achievementNotice`.
- **Reconcile on login:** when a profile is selected or logged in, run `evaluateNewAchievements` over the full history **without setting a notice**. Existing players get credit for streak, personal-best and mastery badges, and each badge added by a later ticket is backfilled automatically. `weekly-goal-met` is never backfilled, because the goal didn't exist back then.
- New setters: `setWeeklyScoreGoal(goal: number | null)` and `dismissAchievementNotice()`.
- Persist version 5 → 6. `migrateProfiles` defaults `achievements: []` and checks `weeklyScoreGoal`, setting it to `undefined` unless it is a positive integer.

## 5. UI

**Achievements page** (`src/ui/components/AchievementsOverlay/`): a new `MenuList` entry and a route in `App.tsx`.

- Streak card: "Week 2 of 3 → Relentless Bronze", Mon to Sun day dots, a shield indicator, and an "at risk" warning.
- Relentless medal shelf: three tiers, locked or earned, with the earned date and the rule subtitle.
- Goal card: a progress bar, or a link to Settings when the goal is off.
- Badge grid: Goal Met count, Personal Best, Focus of the Week (showing the current focus operation), and four Mastery tiles with progress (for example "× 86% / 4.6s → needs 90% / 4.0s").

**Settings** (`SettingsOverlay`)

- A weekly goal section with the existing `Select`. Options are Off, Suggested (when available), and the presets.
- Helper text: "Only runs with 85% accuracy or higher count. Up to 40% of the goal counts each day."
- It uses the same Save flow as the avatar section.

**Game Over** (`GameOverOverlay`)

- "✓ Counts toward weekly goal: +320 (68%)", "78% accuracy, reach 85% for it to count", or "Daily cap reached, come back tomorrow!"

**Weekly Report** (`WeeklyReportOverlay`)

- Adds the goal bar and streak status for the calendar week. The existing rolling-7-day stats stay as they are.

**AchievementNoticeOverlay**

- Shown after a run when `achievementNotice` is set. It reuses `stage_confetti`.

**Feature flag and translations**

- Feature flag `achievements` in `src/shared/feature-flags.json`. When it is off, the menu entry, the notices and the Game Over line are hidden.
- i18n keys in `en` and `uk`.

## 6. Test strategy

- **`test:store`**:
  - Week and day boundaries: Sunday 23:59 vs Monday 00:00, DST changes, W52/W53 → W01.
  - The 85% boundary (84.9 vs 85.0) and the 10-answer minimum.
  - The daily cap across several runs in one day.
  - Shield banked at week 4, used on a short week, at most 1 banked.
  - Tier escalation, no duplicate awards, personal best with fewer than 2 weeks of history.
  - The mastery window of the last 50 attempts.
  - Silent reconcile on login, and the v5→v6 migration.
- **`test:react`**: each overlay state, the Settings goal save, Game Over goal messages, and the notice overlay.
- **Storybook**: desktop and mobile stories for each new or changed UI state.
- **e2e visual snapshots**: Achievements and Settings. Run them in Docker later, as the Workflow section describes.

## 7. Learning-quality principles behind these rules

1. **The goal rewards accuracy, not raw score:** only runs at 85% or higher count.
2. **Active days need real practice:** 10 correct answers, not just opening the game.
3. **Weak spots get targeted practice** through Focus of the Week.
4. **Mastery means fluency:** both accuracy and speed.
5. **Missed weeks are forgiven:** the shield stops one missed week from wiping out a long streak.
6. **Players compare with themselves:** the personal-best badge and the suggested goal are based on the player's own history.
7. **Practice is spread out:** the daily cap and one-active-day-per-day rule spread practice across the week, which helps retention.
