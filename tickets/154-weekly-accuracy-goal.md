# [FEATURE] Weekly accuracy goal: set in Settings, track progress

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [Weekly achievements plan and tracker](./weekly-achievements-plan.md) · issue #25
> **Sprint:** `25-idea-add-medals`
> **Owner (PM):** TBD
> **Engineering lead:** TBD
> **Estimate:** L

---

## 1. Summary

Let a player set a weekly goal in Settings: **"score X, counting only runs with 85% accuracy or higher."** At most 40% of X counts per day. Show progress on the Achievements page, the Weekly Report and the Game Over screen, including clear feedback when a run doesn't count.

---

## 2. Problem / Opportunity

- **Problem statement:** A raw score target rewards rushing. A goal that requires accuracy and is spread across several days rewards careful, regular practice.
- **Evidence:** Plan §0 and §7, points 1 and 7.
- **Success metric(s):** Average accuracy of runs from profiles with a goal is the same or higher than before.

---

## 3. User Stories

### Story 1: Set a weekly goal
**As a** player (or parent)
**I want to** choose a weekly goal in Settings
**So that** I have a clear target for the week

**Acceptance Criteria:**
- [ ] Given I open Settings, then a "Weekly goal" section shows a `Select` with Off / 500 / 1,000 / 2,500 / 5,000 and helper text about the 85% rule and the daily cap.
- [ ] Given I pick 1,000 and press Save, then `profile.weeklyScoreGoal = 1000` is saved.
- [ ] Given I pick Off and save, then `weeklyScoreGoal` is cleared and the goal is hidden everywhere.
- [ ] Given I changed only the goal, then Save is enabled. Saving the avatar and the goal together works.
- [ ] Given I'm a guest, then the goal section is disabled, with the hint "Create a profile to set a goal".

**Out of scope:** the "Suggested" option (#155) and custom number input.

### Story 2: Track goal progress
**As a** player with a goal
**I want to** see how much of it I've reached this week
**So that** I know how much more to practise

**Acceptance Criteria:**
- [ ] Given goal 1,000 and qualifying runs this week scoring 200 (Mon) and 300 (Tue), then the progress is 500 / 1,000 (50%) on the Achievements goal card and the Weekly Report.
- [ ] Given a run with 84.9% accuracy, then it adds nothing. A run at 85.0% counts.
- [ ] Given a run with fewer than 10 answers, then it doesn't count, whatever its accuracy.
- [ ] Given goal 1,000 and qualifying runs on one day totalling 700, then only 400 is counted for that day (the 40% cap).
- [ ] Given goal Off, then the Achievements goal card shows "Set a weekly goal" with a link to Settings.

**Out of scope:** the Goal Met badge (#155).

### Story 3: Feedback after each run
**As a** player
**I want to** know straight away whether my run counted
**So that** I learn that accuracy matters

**Acceptance Criteria:**
- [ ] Given a qualifying run, then Game Over shows "✓ Counts toward weekly goal: +N (P%)".
- [ ] Given a run below 85%, then Game Over shows "A% accuracy, reach 85% for it to count".
- [ ] Given a qualifying run after today's cap is reached, then Game Over shows "Daily goal limit reached, come back tomorrow!"
- [ ] Given goal Off or the `achievements` flag off, then no goal line is shown.

**Out of scope:** in-game HUD goal indicators.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Existing similar component | `src/ui/components/SettingsOverlay/index.tsx` | Section layout, Save flow, `isSaveAnimating` |
| Existing similar component | `src/ui/components/Select/index.tsx` | Select with keyboard support and external label |
| Existing similar component | `src/ui/components/GameOverOverlay/index.tsx` | Where to add the goal line |

**Text fallback:** the Settings section is titled "Weekly goal", with the select underneath, then small grey helper text. The goal bar is a horizontal progress bar labelled "500 / 1,000", with today's credited amount shown as "+200 today (max 400)".

---

## 5. Technical Notes / Implementation Guidance

- **Affected components/files:**
  - `src/store/constants.ts`: `GOAL_MIN_ACCURACY`, `GOAL_MIN_ANSWERS`, `GOAL_DAILY_CAP_RATIO`, `WEEKLY_GOAL_PRESETS`.
  - `src/store/types.ts`: `PlayerProfile.weeklyScoreGoal?`, `setWeeklyScoreGoal(goal: number | null): LoginResult`.
  - `src/store/utilities/migrateProfiles.ts`: check `weeklyScoreGoal`, which must be a positive integer, otherwise `undefined`. No persist version bump: #152 (a blocker) already moves to v6, and this optional field needs only validation.
  - `src/store/selectors/achievements.ts`: `isQualifyingRun` and `computeWeeklyGoalProgress(history, goal, now)`. Apply the daily cap in run order within each day.
  - `SettingsOverlay`, `AchievementsOverlay` (goal card), `WeeklyReportOverlay` (goal section, calendar week), `GameOverOverlay` (goal line).
  - i18n `en` and `uk`.
- **Owning layer:** store for the rules and saving, React for display. Game Over reads the latest history entry from the store; `main.ts` doesn't change.
- **Feature flag:** `achievements`.
- **Test lanes:** `test:store` for 85% and 10-answer boundaries, the daily cap across runs, week boundaries, and the setter. `test:react` for the Settings save, goal card, Weekly Report section and Game Over variants.

---

## 6. Dependencies & Risks

- **Blocked by:** #151, #152
- **Blocks:** #155
- **Risks/open questions:** the Weekly Report would mix a rolling 7-day window (existing stats) with a calendar week (goal). Label the goal section "This week (Mon to Sun)" to avoid confusion.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] `test:store` and `test:react` passing; `typecheck` and `lint` clean
- [ ] Desktop and mobile stories: Settings goal Off and set, goal card at 0% / partial / capped today / met, Game Over counted / not counted / capped
- [ ] Visual snapshot for Settings updated (run in Docker later)
- [ ] Accessibility: progress bar has `role="progressbar"` with `aria-valuenow`

---

## 8. Links

- Parent epic: [weekly-achievements-plan.md](./weekly-achievements-plan.md)
- Related tickets: #151, #155
- PR(s): —
