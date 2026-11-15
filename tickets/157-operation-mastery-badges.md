# [FEATURE] Operation mastery badges (accuracy and speed)

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P2
> **Epic:** [Weekly achievements plan and tracker](./weekly-achievements-plan.md) · issue #25
> **Sprint:** `25-idea-add-medals`
> **Owner (PM):** TBD
> **Engineering lead:** TBD
> **Estimate:** M

---

## 1. Summary

Add four **Mastery** badges (+ − × ÷). Each one is earned when the player's last 50 attempts in that operation reach **90% or higher accuracy** and an **average time at or under the operation's threshold** (+/− 3.0s, ×/÷ 4.0s). Show progress toward each badge on the Achievements page.

---

## 2. Problem / Opportunity

- **Problem statement:** Streaks and goals reward effort. Mastery badges reward fluency, which is the real learning goal.
- **Evidence:** Plan §7, point 4. Per-operation `attempts`, `incorrect` and `avgTimeMs` are already saved in `operationStats`.
- **Success metric(s):** Number of mastery badges earned per active profile.

---

## 3. User Stories

### Story 1: Earn mastery
**As a** player
**I want to** earn a mastery badge when I'm accurate and fast in an operation
**So that** I know I've really learned it

**Acceptance Criteria:**
- [ ] Given my most recent runs containing `+` add up to 50 or more `+` attempts with 92% accuracy and an average of 2.8s, when the run is saved, then `mastery-add` (with `operation: '+'`) is saved, with a notice.
- [ ] Given 91% accuracy but 3.4s average for `+`, then it isn't earned.
- [ ] Given fewer than 50 total attempts in an operation, then it isn't earned and the tile shows "N / 50 attempts".
- [ ] Given mastery is already earned, then it is never awarded again or taken away, even if later performance drops.
- [ ] Given the silent check on login, then mastery that history already shows is backfilled without a notice.

**Out of scope:** tiered mastery levels and per-grade thresholds.

### Story 2: See mastery progress
**As a** player
**I want to** see how close I am to each mastery badge
**So that** I know whether to work on accuracy or speed

**Acceptance Criteria:**
- [ ] Given `*` at 86% and 4.6s, then the tile shows "86% / 4.6s → needs 90% / 4.0s", and the part that isn't met yet is highlighted.
- [ ] Given mastery is earned, then the tile shows the earned date.

**Out of scope:** —

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Existing similar component | `src/ui/components/PerformanceOverlay/` | How accuracy and speed are calculated and shown for each operation |

**Text fallback:** four ⚡ tiles labelled with the operation symbol. Each shows two small figures (accuracy and speed), with the part that isn't met yet in amber.

---

## 5. Technical Notes / Implementation Guidance

- **Affected components/files:**
  - `src/store/constants.ts`: `MASTERY_MIN_ACCURACY = 0.9`, `MASTERY_WINDOW_ATTEMPTS = 50`, `MASTERY_MAX_AVG_MS = { '+': 3000, '-': 3000, '*': 4000, '/': 4000 }`.
  - `src/store/selectors/achievements.ts`: `computeOperationMastery(history, op)`. Go from the newest run to the oldest, adding up `operationStats[op]` until there are 50 or more attempts. Weight `avgTimeMs` by attempts. Include the whole last run even if it goes past 50.
  - Reuse helpers from `src/store/selectors/performance.ts` if they fit, rather than duplicating them.
  - `AchievementsOverlay` mastery tiles, i18n.
- **Owning layer:** store selectors and evaluator, React for display.
- **Test lanes:** `test:store` (window building, weighted average, threshold boundaries, never taken away, backfill) and `test:react`.

---

## 6. Dependencies & Risks

- **Blocked by:** #152, #155 (badge grid)
- **Blocks:** —
- **Risks/open questions:** the time thresholds may be too strict for younger grades. They're kept as constants so they can be tuned after release.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] `test:store` and `test:react` passing; `typecheck` and `lint` clean
- [ ] Desktop and mobile stories: all locked, mixed progress, all earned
- [ ] Visual snapshot for Achievements added (run in Docker later)

---

## 8. Links

- Parent epic: [weekly-achievements-plan.md](./weekly-achievements-plan.md)
- Related tickets: #152
- PR(s): —
