# [FEATURE] Streak shield protects one missed week

> **Ticket type:** Feature
> **Status:** Ready for Dev
> **Priority:** P2
> **Epic:** [Weekly achievements plan and tracker](./weekly-achievements-plan.md) · issue #25
> **Sprint:** `25-idea-add-medals`
> **Owner (PM):** TBD
> **Engineering lead:** TBD
> **Estimate:** S

---

## 1. Summary

Every 4 streak weeks in a row bank one **streak shield**, with at most 1 banked. If a week ends with fewer than 3 active days, a banked shield is used up automatically: the streak continues, but the covered week doesn't add to the count. Warn the player when their streak is at risk. This matches the game's existing shield idea.

---

## 2. Problem / Opportunity

- **Problem statement:** Losing a long streak because of one busy or sick week often makes children give up altogether.
- **Evidence:** Plan §7, point 5 (forgiving missed weeks).
- **Success metric(s):** Fewer profiles stop practising in the 2 weeks after a missed week.

---

## 3. User Stories

### Story 1: Bank and use a shield
**As a** player with a long streak
**I want to** have one missed week forgiven
**So that** one bad week doesn't wipe out my progress

**Acceptance Criteria:**
- [ ] Given 4 streak weeks in a row, then `shieldBanked` is 1. After 8 weeks it is still 1 (the maximum).
- [ ] Given a banked shield and a completed week with 2 active days, then the streak continues, the count stays the same, and the shield is used up (`shieldUsedWeekKeys` contains that week).
- [ ] Given no banked shield and a short week, then the streak resets to 0.
- [ ] Given two short weeks in a row with only one shield, then the streak resets after the second.
- [ ] Edge case: the shield is worked out only from history (by walking the weeks), and **nothing extra is saved**.

**Out of scope:** buying or earning shields any other way.

### Story 2: See shield and risk status
**As a** player
**I want to** see whether I have a shield and whether my streak is at risk
**So that** I can plan my practice days

**Acceptance Criteria:**
- [ ] Given a banked shield, then the streak card shows a shield icon with the tooltip "One missed week will be forgiven" (`achievements.shield.tooltip`).
- [ ] Given it's Friday or later and I can't reach 3 active days without practising every remaining day, then the card shows "Streak at risk" (`achievements.streak.atRisk`), or "Your shield will protect your streak" (`achievements.shield.willProtect`) if a shield is banked.
- [ ] Given a week was covered by a shield, then its day-dot history (if shown) is marked as shielded, with "Week protected by shield" (`achievements.shield.weekShielded`) as the label.

**Out of scope:** push or system notifications.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Existing similar component | `src/ui/components/HUDOverlay/StatusItem.tsx` | The game's shield icon and visual language |

**Text fallback:** a small shield badge in the top-right corner of the streak card. An amber "at risk" banner sits under the day dots.

---

## 5. Technical Notes / Implementation Guidance

- **Affected components/files:**
  - `src/store/constants.ts`: `SHIELD_EVERY_N_WEEKS = 4`, `SHIELD_MAX_BANKED = 1`.
  - `src/store/selectors/achievements.ts`: extend `computeWeeklyStreak` with `shieldBanked`, `shieldUsedWeekKeys` and `atRisk`.
  - Check that Relentless medal evaluation (#152) treats shielded weeks as continuing the streak but not adding to the count.
  - `AchievementsOverlay`, and i18n (see plan → i18n keys, rows "Added in #153"). The keys are:
    - `achievements.shield.title` ("Streak Shield" / «Щит серії»)
    - `achievements.shield.tooltip` ("One missed week will be forgiven" / «Один пропущений тиждень не зламає серію»)
    - `achievements.streak.atRisk` ("Streak at risk" / «Серія під загрозою»)
    - `achievements.shield.willProtect` ("Your shield will protect your streak" / «Щит збереже твою серію»)
    - `achievements.shield.weekShielded` ("Week protected by shield" / «Тиждень захищено щитом»)
- **Owning layer:** pure store selector and React display. No change to the persisted shape.
- **Test lanes:** `test:store` (bank, use, maximum, two short weeks, interaction with tiers), `test:react`.

---

## 6. Dependencies & Risks

- **Blocked by:** #152
- **Blocks:** —
- **Risks/open questions:** none.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] `test:store` and `test:react` passing; `typecheck` and `lint` clean
- [ ] Desktop and mobile stories: shield banked, at risk, at risk with shield

---

## 8. Links

- Parent epic: [weekly-achievements-plan.md](./weekly-achievements-plan.md)
- Related tickets: #151, #152
- PR(s): —
