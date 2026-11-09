# Generated tickets by agent

> **How to use this file:** This README is the single tracker for one batch of agent-generated tickets.
> Replace every `<placeholder>` below, create one ticket file per row in the [Tickets](#tickets) table,
> and keep the table in sync as tickets move through their lifecycle. Leave the instructions in
> blockquotes as-is or delete them once the batch is filled in.

> **Dev branch:** `dev-<yyyymmdd>-<batch-slug>` (e.g. `dev-20261108-settings-overlay`)
> **Batch issue:** #<number> — GitHub issue that represents the whole batch; used for the dev → master PR.
> **Batch status:** Draft / In Progress / In Review / Done

## Goal

<One or two sentences describing the outcome this batch of tickets delivers and why it matters.>

### Starting point

<Current state of the codebase/feature before any ticket is worked: what exists, what is missing, known constraints. Link relevant files, e.g. `src/game/main.ts`.>

### Workflow

> Default workflow for an agent picking up tickets from this batch. Adjust if the batch needs something different.
> Assumes a small project with a single developer: one ticket in progress at a time, no parallel ticket branches.

1. Pick the highest-priority ticket in the [Tickets](#tickets) table whose status is `Ready for Dev` and whose **Blocked by** tickets are all `Done`.
2. Set its status to `In Progress` in both the ticket file and the table.
3. Check out the dev branch, pull it, and create the ticket branch from it (see [Branching rules](#branching-rules)).
4. Implement the ticket in its owning layer (see `CLAUDE.md` → Code Ownership), add/update tests and stories.
5. Run verification locally — CI only runs on PRs to `master`, so the local run is the gate for ticket merges:
   `npm run typecheck`, `npm run lint`, the narrowest test lane, then `npm run test:all` if cross-cutting.
   Skip e2e (`npm run test:e2e*`) for now; it needs a Docker image to match the CI environment.
6. Run the `code-reviewer` subagent and address findings.
7. Commit using `<type>: #<ticket> <description>`, then set status to `In Review`.
8. Merge into the dev branch (see [Merge rules](#merge-rules)), set status to `Done`, and unblock dependent tickets.
9. When every ticket is `Done`, open the dev → master PR and set **Batch status** to `In Review`.

### Branching rules

| Branch | Name | Created from | Merges into |
| --- | --- | --- | --- |
| Dev (batch bucket) | `dev-<yyyymmdd>-<batch-slug>` | `master`, when the batch starts | `master`, once per batch |
| Ticket | `<ticket-number>-<short-slug>` (e.g. `142-add-settings-overlay`) | the dev branch | the dev branch |

- Use the date the batch starts, in `yyyymmdd` format, plus a short kebab-case slug of the batch goal.
- Use a hyphen, not a slash (`dev-...`, never `dev/...`) — git cannot hold both a `dev` branch and `dev/*` branches.
- Never branch a ticket from `master` or from another ticket branch.
- Never commit directly to the dev branch except for README/ticket status updates and syncing with `master`.
- Record the dev branch name in the header of this README before the first ticket starts.

### Merge rules

- **Ticket → dev:** squash-merge, so the dev branch has exactly one commit per ticket:
  `<type>: #<ticket> <description>`. Delete the ticket branch afterwards.
- **Dev → master:** open a PR from the dev branch to `master` (this is where CI runs) and merge with a
  **merge commit** (no squash, no rebase) so per-ticket commits stay in `master` history.
  - PR title / merge commit: `merge: #<batch-issue> <batch-slug> into master`
    (e.g. `merge: #150 settings-overlay into master`).
  - PR description: link this README and list the tickets included.
- **Syncing with master:** single-developer assumption — `master` rarely moves during a batch. If it does,
  merge `master` into the dev branch before starting the next ticket. Do not rebase the dev branch.
- **After the batch merges:** delete the dev branch and set **Batch status** to `Done`.

### Exceptions

> Cases where the agent must stop and ask instead of proceeding.

- <A ticket requires changing the Electron security posture (`contextIsolation`, `nodeIntegration`).>
- <Acceptance criteria are ambiguous or contradict another ticket.>
- <A dependency upgrade or release is needed (`/npm-upgrade`, `/release-workflow` are user-invoked only).>
- The dev branch is behind `master` and merging `master` into it produces conflicts.
- No dev branch is recorded in the header, or the recorded branch does not exist.
- <Other batch-specific exceptions.>

### Definition of done

> Applies to the batch as a whole. Each ticket also has its own Definition of Done (section 7 of the ticket template).

- [ ] All tickets in the table are `Done` and squash-merged into the dev branch
- [ ] `npm run typecheck`, `npm run lint`, and `npm run test:all` pass locally on the dev branch
- [ ] Dev → master PR is green in CI and merged with a merge commit
- [ ] Desktop and mobile stories exist for any changed UI
- [ ] Documentation updated where behavior changed
- [ ] <Batch-specific criterion>

### Tickets

> - One row per ticket. Ticket files live next to this README as `tickets/<number>-<short-slug>.md`
>   and follow [docs/AgileTicketTemplate.md](../docs/AgileTicketTemplate.md).
> - Link the **Ticket** cell to the ticket file.
> - **Type:** Feature / Bug / Chore / Refactor / Test / Docs / Spike
> - **Priority:** P0 (critical) / P1 (high) / P2 (medium) / P3 (low)
> - **Size:** XS / S / M / L / XL
> - **Status:** Draft / Ready for Dev / In Progress / In Review / Done — must match the ticket file's header.
> - **Blocked by:** comma-separated ticket numbers, or `—` if none.

| Ticket | Title | Type | Priority | Size | Status | Blocked by |
| --- | --- | --- | --- | --- | --- | --- |
| [#<number>](./<number>-<short-slug>.md) | <Concise, action-oriented title> | Feature | P1 | M | Draft | — |

### Expected end state

<Describe what the product and codebase look like once every ticket is Done: user-visible behavior, new/changed modules, tests and stories added.>

---

## Ticket file template

> Copy [docs/AgileTicketTemplate.md](../docs/AgileTicketTemplate.md) into `tickets/<number>-<short-slug>.md` for each ticket.
> Agent-specific guidance when filling it in:

- **Title:** replace `[FEATURE]` with the ticket type (`[BUG]`, `[CHORE]`, …) when it is not a feature.
- **Header fields:** `Status`, `Priority`, and `Estimate` must match the row in the table above.
- **Epic:** link back to this README and the batch issue.
- **Sprint:** the dev branch name.
- **User stories:** keep each story independently testable; always fill in **Out of scope**.
- **Design & reference assets:** prefer repo paths (`docs/assets/...`) or existing components/stories under `src/ui/components/**`, with a text fallback for every visual.
- **Technical notes:** name the owning layer (`src/game/main.ts`, `GameScene`, `useGameStore`, React overlay, Electron) and which test lane covers it.
- **Dependencies:** `Blocked by` / `Blocks` must match the table above.
- **Definition of done:** drop items that do not apply (e.g. analytics, PM sign-off) rather than leaving them unchecked.
