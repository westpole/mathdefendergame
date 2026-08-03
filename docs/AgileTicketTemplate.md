# [FEATURE] <Concise, action-oriented title>

> **Ticket type:** Feature
> **Status:** Draft / Ready for Dev / In Progress / In Review / Done
> **Priority:** P0 / P1 / P2 / P3
> **Epic:** [Link to parent epic/initiative]
> **Sprint:** <sprint name/number>
> **Owner (PM):** <name>
> **Engineering lead:** <name>
> **Estimate:** <story points / t-shirt size>

---

## 1. Summary

One or two sentences describing what this feature does and why it matters. Written so an engineer or agent with zero prior context understands the goal immediately.

> Example: "Add a 'Save for Later' button to the product card so users can bookmark items without adding them to cart."

---

## 2. Problem / Opportunity

- **Problem statement:** What user or business problem does this solve?
- **Evidence:** Data, user research, support tickets, or metrics that justify this work. Link sources.
- **Success metric(s):** How we'll know this worked (e.g., "increase return-visit rate by 5%").

---

## 3. User Stories

Write each story in standard format, independently testable, and small enough to ship on its own. Order by priority/dependency.

### Story 1: <short title>
**As a** <user type>
**I want to** <action/capability>
**So that** <benefit/value>

**Acceptance Criteria:**
- [ ] Given <context>, when <action>, then <expected result>
- [ ] Given <context>, when <action>, then <expected result>
- [ ] Edge case: <describe edge case and expected behavior>

**Out of scope:** <explicitly state what this story does NOT cover, to prevent scope creep by the agent>

---

### Story 2: <short title>
**As a** <user type>
**I want to** <action/capability>
**So that** <benefit/value>

**Acceptance Criteria:**
- [ ] Given <context>, when <action>, then <expected result>
- [ ] Given <context>, when <action>, then <expected result>

**Out of scope:** <...>

*(Repeat for additional stories)*

---

## 4. Design & Reference Assets

Copilot agents can't "see" a Figma file the way a human can, so give both a visual reference AND a text description of what matters in it.

| Asset | Link | What to look at |
|---|---|---|
| Figma mockup | `https://figma.com/file/...?node-id=...` (use the **node-specific** link, not just the file root) | Primary layout, spacing, states (default/hover/error) |
| Design spec / redlines | `https://figma.com/...` or exported PDF path | Exact measurements, font sizes, colors |
| Prototype (clickable) | `https://figma.com/proto/...` | Interaction flow between screens |
| Screenshot(s) | `/mnt/user-data/uploads/screenshot.png` or repo path `docs/assets/feature-x.png` | Embed inline if possible — agents parse images in-repo more reliably than external links |
| Brand/style guide | `<link>` | Color tokens, typography scale |
| Existing similar component | `<repo path or Storybook link>` | Reuse patterns/components already in codebase |

**Guidance for linking assets so an agent can use them:**
1. **Prefer stable, permanent links** over "temporary" share links that expire.
2. **Link to specific frames/nodes**, not whole Figma files — a node-id link jumps straight to the relevant screen.
3. **Embed images directly in the ticket** (drag-and-drop into GitHub/Jira, or reference a checked-in path like `docs/assets/`) — agents often can't authenticate into design tools, but can read images committed to the repo or attached to the issue.
4. **Add a text fallback** under every visual link: 2–3 bullets describing what the image shows, in case the agent can't render it.
5. **Version your assets** (e.g., `feature-x-v2.png`) and note which version is current if the file has multiple iterations.

---

## 5. Technical Notes / Implementation Guidance

- **Affected components/files:** `<paths, if known>`
- **API/data dependencies:** `<endpoints, schemas, feature flags>`
- **Non-functional requirements:** performance, accessibility (WCAG level), i18n, analytics events to fire
- **Feature flag:** `<flag name>` (default off/on)

---

## 6. Dependencies & Risks

- **Blocked by:** <ticket links>
- **Blocks:** <ticket links>
- **Risks/open questions:** <list, with owner for each>

---

## 7. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit/integration tests written and passing
- [ ] Design review passed (matches mocks within agreed tolerance)
- [ ] Accessibility check passed
- [ ] Analytics events verified
- [ ] Documentation updated
- [ ] PM sign-off

---

## 8. Links

- Parent epic: `<link>`
- Related tickets: `<link>`
- PR(s): `<link, once opened>`
- Design file: `<link>`
