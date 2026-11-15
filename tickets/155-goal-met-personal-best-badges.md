# [FEATURE] Goal Met and Personal Best Week badges, plus suggested goal

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P2
> **Epic:** [Weekly achievements plan and tracker](./weekly-achievements-plan.md) · issue #25
> **Sprint:** `25-idea-add-medals`
> **Owner (PM):** TBD
> **Engineering lead:** TBD
> **Estimate:** M

---

## 1. Summary

Award a **Goal Met** badge each week the weekly goal is reached, and a **Personal Best Week** badge when the week's credited score beats the player's own 4-week baseline. Add a **Suggested** goal option in Settings (baseline × 1.1), so the target fits the player's actual level.

---

## 2. Problem / Opportunity

- **Problem statement:** Fixed goals are too easy for strong players and too hard for beginners. Rewards need to compare players with themselves.
- **Evidence:** Plan §7, point 6.
- **Success metric(s):** Share of goal-setting profiles that meet their goal at least once in 4 weeks.

---

## 3. User Stories

### Story 1: Goal Met badge
**As a** player with a goal
**I want to** earn a badge when I reach it
**So that** reaching my goal feels rewarding

**Acceptance Criteria:**
- [ ] Given goal 1,000 and 900 credited, when a qualifying run takes credited past 1,000, then `weekly-goal-met` with this `weekKey` is saved and a notice is shown.
- [ ] Given the badge is already earned this week, then more runs don't add another.
- [ ] Given I earned it in 3 different weeks, then the badge tile on Achievements shows "×3".
- [ ] Given the silent check on login, then `weekly-goal-met` is **never** backfilled.

**Out of scope:** changing a goal partway through a week. The badge uses the goal in effect at the time of the run.

### Story 2: Personal Best Week badge
**As a** player
**I want to** be recognized when I beat my usual week
**So that** improvement counts at every skill level

**Acceptance Criteria:**
- [ ] Given at least 2 complete weeks of history and a 4-week baseline of 800, when this week's credited score passes 800, then `personal-best-week` with this `weekKey` is saved, with a notice.
- [ ] Given fewer than 2 complete weeks of history, then the badge can't be earned and the tile shows "Play 2 weeks to unlock".
- [ ] Given no goal is set, then credited score uses a daily cap of 40% of the suggested goal.
- [ ] Given the silent check on login, then past personal-best weeks are backfilled without a notice.

**Out of scope:** —

### Story 3: Suggested goal
**As a** player or parent
**I want to** pick a goal based on my recent play
**So that** the goal is challenging but reachable

**Acceptance Criteria:**
- [ ] Given a baseline of 800, then Settings offers "Suggested (900)", which is 800 × 1.1 = 880 rounded to the nearest 50.
- [ ] Given fewer than 2 complete weeks, then the Suggested option is hidden.
- [ ] Given I save Suggested, then the numeric value is saved. It doesn't update automatically later.

**Out of scope:** goals that adjust themselves automatically.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Existing similar component | `AchievementsOverlay` Relentless medal shelf from #152 | Earned and locked tile styling to reuse in the badge grid |

**Text fallback:** a badge grid of square tiles (icon, name, and a short line of status or count). 🎯 Goal Met shows a "×N" count. 📈 Personal Best shows the last earned date, or the unlock hint.

---

## 5. Technical Notes / Implementation Guidance

- **Affected components/files:**
  - `src/store/constants.ts`: `GOAL_SUGGESTION_MULTIPLIER`, `GOAL_SUGGESTION_ROUND_TO = 50`.
  - `src/store/selectors/achievements.ts`: `computeFourWeekBaseline`, `computeSuggestedGoal`, and evaluators for `weekly-goal-met` and `personal-best-week`, plus a flag that excludes goal-met from the silent check.
  - `AchievementsOverlay`: badge grid, introduced here and extended in #156 and #157.
  - `SettingsOverlay`: Suggested option.
  - i18n.
- **Owning layer:** store selectors and evaluators, React for display.
- **Test lanes:** `test:store` for baseline with 0/1/2/4 weeks, rounding, goal-met deduplication per week, the no-backfill rule, and personal-best backfill. `test:react` for the badge grid and the Suggested option.

---

## 6. Dependencies & Risks

- **Blocked by:** #152, #154
- **Blocks:** #156, #157 (they extend the badge grid introduced here)
- **Risks/open questions:** the baseline includes weeks with 0 credited score, which lowers it after time away. That's intended, because it makes coming back easier.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] `test:store` and `test:react` passing; `typecheck` and `lint` clean
- [ ] Desktop and mobile stories: badge grid locked / earned / counted; Settings with Suggested

---

## 8. Links

- Parent epic: [weekly-achievements-plan.md](./weekly-achievements-plan.md)
- Related tickets: #152, #154
- PR(s): —
