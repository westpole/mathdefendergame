# [FEATURE] Achievements page with live weekly streak progress

> **Ticket type:** Feature
> **Status:** Done
> **Priority:** P1
> **Epic:** [Weekly achievements plan and tracker](./weekly-achievements-plan.md) · issue #25
> **Sprint:** `25-idea-add-medals`
> **Owner (PM):** TBD
> **Engineering lead:** TBD
> **Estimate:** M

---

## 1. Summary

Add a new **Achievements** screen, reached from the menu, that shows the player's live weekly streak: how many weeks in a row they've had 3 or more active days, and which days this week are already active. This is the first slice. It sets up the week and day logic, the screen route and the feature flag that later tickets build on. Nothing is saved yet: everything is worked out from existing history.

---

## 2. Problem / Opportunity

- **Problem statement:** Players get no reason to come back regularly. The Weekly Report shows a rolling 7-day summary, but nothing tracks consistency across weeks.
- **Evidence:** Spaced, regular practice improves retention of arithmetic facts more than long, rare sessions. See plan §7.
- **Success metric(s):** More profiles with 3 or more active days per week, once the full batch ships.

---

## 3. User Stories

### Story 1: See my streak progress
**As a** logged-in player
**I want to** open an Achievements page from the menu
**So that** I can see how close I am to keeping my weekly streak

**Acceptance Criteria:**
- [ ] Given the `achievements` flag is on, when I open the menu, then I see an "Achievements" entry that opens `screenView: 'achievements'`.
- [ ] Given I have runs on Mon and Wed of this week, each with 10 or more correct answers, when I open Achievements, then the day dots show Mon and Wed as active and the text says "1 more day needed this week".
- [ ] Given two runs on the same day with 6 + 5 correct answers, when I view the streak, then that day counts as active (the total is 11).
- [ ] Given 2 complete previous weeks with 3 or more active days each, when I view the streak, then it shows "2 weeks in a row" and progress toward Relentless Bronze, which needs 3.
- [ ] Given the current week has fewer than 3 active days so far, when I view the streak, then the streak is **not** shown as broken until the week ends.
- [ ] Given the `achievements` flag is off, then the menu entry is hidden and the `achievements` view can't be reached.
- [ ] Edge case: a run at Sunday 23:59 local time counts toward the week that is ending, and a run at Monday 00:00 counts toward the new week.
- [ ] Edge case: across the year boundary (W52/W53 → W01), the weeks are treated as consecutive.

**Out of scope:** saving medals, notices, shields, goals and badges, which come in #152–#157. The medal shelf and badge grid are not part of this ticket.

### Story 2: Guest view
**As a** guest player
**I want to** see my streak progress
**So that** I can try the feature before creating a profile

**Acceptance Criteria:**
- [ ] Given I play as a guest, when I open Achievements, then my streak is worked out from the guest history and a hint says that awards are saved only for named profiles.

**Out of scope:** moving guest progress over to a new profile.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Existing similar component | `src/ui/components/WeeklyReportOverlay/index.tsx` | Panel layout, header with `ProfileIcon`, stat cards |
| Existing similar component | `src/ui/components/GradeRequirementsList/` | Progress row styling |

**Text fallback:** an overlay panel styled like the Weekly Report. At the top is a streak card with a large "N weeks in a row" figure, a subtitle "Next: Relentless Bronze (3 weeks)" (`uk`: «Далі — Незламний: бронза (3 тижні)»), then the rule subtitle "Practise at least 3 days a week, 3 weeks in a row" (`uk`: «Тренуйся щонайменше 3 дні на тиждень, 3 тижні поспіль»), and a row of 7 round day dots (Mon to Sun) that are filled when active and hollow otherwise, with today outlined.

---

## 5. Technical Notes / Implementation Guidance

- **Affected components/files:**
  - `src/store/constants.ts`: add `ACTIVE_DAY_MIN_CORRECT`, `STREAK_MIN_DAYS_PER_WEEK`, `STREAK_TIERS`, `DAY_MS`. Move `DAY_MS` out of `WeeklyReportOverlay`.
  - `src/store/selectors/achievements.ts` (new): `toWeekKey`, `toDayKey`, `buildActiveDaysByWeek`, and `computeWeeklyStreak` returning `{ streakWeeks, thisWeekActiveDays, daysNeeded }`. Shield fields come in #153. Take `now` as a parameter.
  - `src/store/selectors/types.ts`: `WeeklyStreakSummary`.
  - `src/store/types.ts`: add `'achievements'` to `ScreenView`.
  - `src/ui/components/AchievementsOverlay/index.tsx` (new), `App.tsx` route, `MenuControls/MenuList.tsx` entry.
  - `src/shared/feature-flags.json`: add `"achievements": true`. Update `src/shared/__mocks__/featureFlags.ts`.
  - `src/assets/locales/{en,uk}/translation.json`: this ticket adds the keys it uses, as listed in the plan's **i18n keys** table (marked "Added in #151"). These are `achievements.relentless.{title,subtitle,tier.*,tierWord.*}` and `achievements.streak.{weeksInARow,next,daysNeeded}`. Every string with a count uses i18next plural suffixes: `_one/_other` for `en`, and `_one/_few/_many/_other` for `uk` («1 тиждень», «3 тижні», «6 тижнів»; «1 день», «2 дні», «5 днів»).
- **Owning layer:** store selectors (pure) and a React overlay. No changes to Phaser or `main.ts`.
- **Non-functional:** day dots need `aria-label`s ("Monday, active"). Week logic uses local time only.
- **Feature flag:** `achievements` (default on).
- **Test lanes:** `test:store` for the selectors, including the boundary cases above. `test:react` for the overlay and menu entry.

---

## 6. Dependencies & Risks

- **Blocked by:** —
- **Blocks:** #152, #154
- **Risks/open questions:** DST changes can shift timestamps by an hour. Build keys from local date parts (`getFullYear/getMonth/getDate`), never by dividing by `DAY_MS`.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] `test:store` and `test:react` tests written and passing; `typecheck` and `lint` clean
- [ ] Desktop and mobile stories for: empty history, mid-week partial, 2-week streak
- [ ] Accessibility check passed (keyboard reachable, labelled dots)
- [ ] i18n keys added for `en` and `uk`, with plural forms tested for 1, 3, 6 and 12 weeks and 1, 2 and 5 days

---

## 8. Links

- Parent epic: [weekly-achievements-plan.md](./weekly-achievements-plan.md)
- Related tickets: #152, #154
- PR(s): —
