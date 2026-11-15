# [FEATURE] Earn and keep the Relentless medal

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P1
> **Epic:** [Weekly achievements plan and tracker](./weekly-achievements-plan.md) · issue #25
> **Sprint:** `25-idea-add-medals`
> **Owner (PM):** TBD
> **Engineering lead:** TBD
> **Estimate:** M

---

## 1. Summary

Award the **Relentless** medal (Ukrainian: **Незламний**) in Bronze, Silver and Gold at 3, 6 and 12 streak weeks in a row. Save them on the profile, show them on a medal shelf on the Achievements page, and celebrate a new medal with a notice after the run. This ticket also adds the awards system that later badge tickets plug into: saved achievements, the store field for notices, and a silent check on login.

---

## 2. Problem / Opportunity

- **Problem statement:** A streak the player can see (#151) is less motivating without a lasting reward and a moment of celebration.
- **Evidence:** Plan §3. The medal is the reward the user asked for.
- **Success metric(s):** Share of active profiles that earn Relentless Bronze within 4 weeks of release.

---

## 3. User Stories

### Story 1: Earn the Relentless medal
**As a** player
**I want to** receive the Relentless medal when I reach 3, 6 or 12 streak weeks
**So that** my regular practice is recognized

**Acceptance Criteria:**
- [ ] Given 2 complete streak weeks and 2 active days this week, when I finish a run that makes the 3rd active day, then `weekly-streak-bronze` is saved to my profile with `earnedAt` and `weekKey`.
- [ ] Given I earned a medal on this run, when the Game Over screen appears, then an `AchievementNoticeOverlay` shows the medal (with confetti when `stage_confetti` is on) and can be dismissed.
- [ ] Given I already have Relentless Bronze, when I reach 3 weeks again after a broken streak, then no duplicate is saved and no notice is shown.
- [ ] Given I reach 6 weeks, then Relentless Silver is awarded. At 12 weeks, Relentless Gold is awarded.
- [ ] Given the language is English, then the medal is named "Relentless Bronze / Silver / Gold". Given Ukrainian, it is named «Незламний: бронза / срібло / золото». Both show the rule subtitle (see plan → Naming).
- [ ] Given a run ends early (`persistPrematureGameEnd`), then awards are checked the same way.

**Out of scope:** shields (#153) and non-streak badges (#155–#157).

### Story 2: Relentless medal shelf
**As a** player
**I want to** see all Relentless tiers on the Achievements page
**So that** I know what I've earned and what comes next

**Acceptance Criteria:**
- [ ] Given no medals, then three locked medal slots show their requirement ("3 weeks in a row", "6 weeks in a row", "12 weeks in a row"; `uk`: «3 тижні поспіль», «6 тижнів поспіль», «12 тижнів поспіль»).
- [ ] Given Relentless Bronze is earned, then the Bronze slot is unlocked and shows the earned date (`formatShortDate`).

**Out of scope:** the badge grid, which comes in #155–#157.

### Story 3: Credit for existing players
**As a** player who played regularly before this release
**I want to** get the medals my history already earns
**So that** I'm not starting from zero

**Acceptance Criteria:**
- [ ] Given my history already has 3 or more streak weeks, when I log in or select my profile, then the matching medals are saved **without** a notice.
- [ ] Given I play as a guest, then medals are worked out for display but never saved.
- [ ] Given stored data from persist v5, when the app loads, then the v6 migration sets `achievements: []` on each profile, and the existing fields are unchanged.

**Out of scope:** goal-met backfill, which is never backfilled.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Existing similar component | `src/ui/components/GradeNoticeOverlay/` | Pattern for a notice after the run, plus its dismiss flow |
| Existing similar component | `src/ui/components/StageMessageOverlay/` | Confetti use behind `stage_confetti` |

**Text fallback:** the shelf is headed "Relentless" (`uk`: «Незламний»), with the rule subtitle underneath, and shows three large round medals in a row (🥉🥈🥇). Locked medals are greyed out with a lock icon and their requirement; earned medals are in full colour with the date. The notice is a centred modal with the medal, the title "Relentless Bronze!" (`uk`: «Незламний: бронза!»), one line of praise and an OK button.

---

## 5. Technical Notes / Implementation Guidance

- **Affected components/files:**
  - `src/shared/types.ts`: `AchievementId` (full union from the plan), `EarnedAchievement`.
  - `src/store/types.ts`: `PlayerProfile.achievements?`, `achievementNotice`, `dismissAchievementNotice`.
  - `src/store/constants.ts`: `initialState.achievementNotice = null`.
  - `src/store/selectors/achievements.ts`: `evaluateNewAchievements(history, profile, now)`, written so later tickets can add evaluators (for example an array of per-badge evaluators).
  - `src/store/transformers/history.ts` and `setters/createGameStoreSetters.ts`: run the check in `addGameHistory` and `persistPrematureGameEnd`, and the silent check in `loginProfile`, `selectProfileByUsername` and the create-and-login setters.
  - `src/store/useGameStore.ts`: `version: 6`. `src/store/utilities/migrateProfiles.ts`: default `achievements`.
  - `src/ui/components/AchievementNoticeOverlay/` (new), mounted in `App.tsx` next to `GradeNoticeOverlay`.
  - `AchievementsOverlay`: Relentless medal shelf.
  - `src/assets/locales/{en,uk}/translation.json`: reuse the `achievements.relentless.*` keys added in #151, and add `achievements.relentless.earned` ("Relentless {{tier}}!" / «Незламний: {{tier}}!») for the notice. See the plan's **i18n keys** table. Add `achievements.relentless.requirement` (plural on `count`) for the locked-slot requirements ("3 / 6 / 12 weeks in a row", «3 тижні / 6 тижнів / 12 тижнів поспіль»). Slot labels use the full-name `tier.*` keys, and the notice uses `earned` with `tierWord.*`. Keep code ids as `weekly-streak-*`. Only the displayed name changes.
  - Ukrainian grammar: use «Незламний» as a standalone or quoted name, never after "медаль" without quotes (see plan → Naming).
- **Owning layer:** Zustand store. React handles display only. No changes to Phaser.
- **Ordering:** the notice must not overlap `gradeNotice`. Show the grade notice first, then the achievement notice.
- **Feature flag:** `achievements`. When it is off, skip the check and the notice.
- **Test lanes:** `test:store` for evaluation, deduplication, silent reconcile and migration. `test:react` for the shelf and the notice.

---

## 6. Dependencies & Risks

- **Blocked by:** #151
- **Blocks:** #153, #154, #155, #156, #157
- **Risks/open questions:** the order of notices on the Game Over screen when a promotion and a medal happen together. Default: show them one after the other.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] `test:store` (including the v5→v6 migration) and `test:react` passing; `typecheck` and `lint` clean
- [ ] Desktop and mobile stories: Relentless shelf with none, Bronze, or all three earned; notice overlay (`en` and `uk`)
- [ ] Accessibility: notice has focus management and a dialog role
- [ ] `src/store/README.md` updated with the achievements contract

---

## 8. Links

- Parent epic: [weekly-achievements-plan.md](./weekly-achievements-plan.md)
- Related tickets: #151, #153, #155–#157
- PR(s): —
