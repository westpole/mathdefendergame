# [FEATURE] Focus of the Week badge for the weakest operation

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

Each week, pick the player's **focus operation**: the one most often flagged as `mostProblematicOperation` over the last 2 weeks. Award **Focus of the Week** for 3 qualifying practice runs in that operation. Show the focus on the Achievements page and in Practice select, so targeted practice is one click away.

---

## 2. Problem / Opportunity

- **Problem statement:** Players tend to practise what they already find easy. Targeted practice on weak operations improves learning the most.
- **Evidence:** Plan §7, point 3. `mostProblematicOperation` is already saved for each run.
- **Success metric(s):** Accuracy in the focus operation goes up from week to week.

---

## 3. User Stories

### Story 1: See my focus operation
**As a** player
**I want to** know which operation to work on this week
**So that** I practise what helps most

**Acceptance Criteria:**
- [ ] Given that over the last 2 weeks `*` was `mostProblematicOperation` in 4 runs and `-` in 2, then the focus is `*`.
- [ ] Given a tie, then choose the operation with lower lifetime accuracy. If they're still tied, use the order `+ - * /`.
- [ ] Given no runs in the last 2 weeks have a problematic operation, then there's no focus and the tile shows "Play a few runs to get your focus".
- [ ] Given a focus exists, then the Achievements tile shows "Focus: Multiplication (×), 1 / 3 practice runs".
- [ ] Given a focus exists, then the Practice select screen marks that operation with a "Focus" tag.

**Out of scope:** changing the focus operation by hand.

### Story 2: Earn the badge
**As a** player
**I want to** earn a badge for practising my focus operation
**So that** working on weak spots is rewarded

**Acceptance Criteria:**
- [ ] Given focus `*`, when I finish the 3rd qualifying **practice** run with operation `*` this week, then `focus-of-the-week` (with `weekKey` and `operation`) is saved, with a notice.
- [ ] Given regular-mode runs or non-qualifying runs (below 85%), then they don't count toward the 3.
- [ ] Given the focus would change partway through the week because of new runs, then the focus is **fixed at the start of the week** (calculated from the 2 weeks before Monday 00:00).
- [ ] Given the silent check on login, then past weeks are backfilled without a notice.

**Out of scope:** focus on topics other than the 4 operations.

---

## 4. Design & Reference Assets

| Asset | Link | What to look at |
|---|---|---|
| Existing similar component | `src/ui/components/PracticeOperationOverlay/index.tsx` | Where to add the "Focus" tag |
| Existing similar component | `src/ui/components/PerformanceOverlay/` | Operation labels and accuracy figures |

**Text fallback:** 🔍 tile in the badge grid, with the operation name and a three-step progress indicator. In Practice select, a small pill reading "Focus" on the matching operation tile.

---

## 5. Technical Notes / Implementation Guidance

- **Affected components/files:**
  - `src/store/selectors/achievements.ts`: `selectFocusOperation(history, now)` (window: the 2 weeks before the current week starts), a progress helper, and the evaluator.
  - `src/shared/types.ts`: check that `GameHistoryEntry` has `mode` and a practice operation, and use them to find the operation of a practice run. If the practice operation isn't saved on the entry, use the operation with the most attempts in `operationStats`.
  - `AchievementsOverlay` tile, `PracticeOperationOverlay` tag, i18n.
- **Owning layer:** store selectors, React for display.
- **Test lanes:** `test:store` (window, tie-break, fixed weekly focus, practice-only counting, backfill) and `test:react`.

---

## 6. Dependencies & Risks

- **Blocked by:** #152, #155 (badge grid)
- **Blocks:** —
- **Risks/open questions:** find out whether practice runs save their operation explicitly. If they don't, the fallback above applies. Do **not** change the history schema in this ticket without asking first.

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] `test:store` and `test:react` passing; `typecheck` and `lint` clean
- [ ] Desktop and mobile stories: no focus, focus 1/3, earned; Practice select with tag

---

## 8. Links

- Parent epic: [weekly-achievements-plan.md](./weekly-achievements-plan.md)
- Related tickets: #152
- PR(s): —
