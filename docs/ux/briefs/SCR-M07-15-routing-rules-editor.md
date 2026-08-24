# SCR-M07-15 · Routing Rules Editor

Ordered condition-to-action routing and escalation rules as tenant data.

**Module:** M07 · Sales Execution · **Personas:** EPC Owner (routing policy edits ride `F2.M01.configure-agent`, §M07.8 permissions) · **Context of use:** web emphasis for setup.

## Entry & exit

Reached from: the tenant-configuration settings area — the settings surface list and its placement are `M01-57`'s (the behaviour of every agent screen is M07's, §M07.3). The exact settings path is not pinned by PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision. Related surface fact: the default hand-over set (§M07.3, M07-11) is the routing layer's seed; "the condition→action editor is the grown-up form of the same list, and both edit the same tenant data" (§M07.8 behavior detail).

## Requirements (verbatim)

### docs/prd/modules/M07-sales-execution.md

- **M07-44** (P0) — **Routing and escalation rules are tenant data, not code**: ordered condition → action rules (confidence, customer-requests-human, intent, priority, business hours, VIP/existing-project) with actions continue · warm transfer · cold transfer · escalate through a chain · queue a callback · voicemail. **Escalation chains ring level by level with timeouts and a mandatory terminal fallback (callback queue or voicemail)** — a customer is never rung into a dead end. Routing policy is versioned; in-flight calls keep the version they started with. _(non-UI half, build-side: chains ring level-by-level with timeouts, mandatory terminal fallback; policy versioned-append — for awareness, not for drawing)_

## States

- **Loading** (base) — the rule list while it fetches.
- **Empty** (base) — the PRD seeds routing from the default hand-over set (§M07.8 behavior detail), so a truly empty list is not the shipped default; if reachable it must teach, never blank.
- **Error** (base) — save/publish failure acknowledged honestly.
- **rule-list** — the ordered condition → action rules with the six condition kinds and six actions of M07-44, editable and reorderable as tenant data.
- **versioned-publish** — publishing versions the routing policy; in-flight calls keep the version they started with (M07-44).
- **mandatory-fallback-enforced** — an escalation chain cannot be saved into a dead end: the terminal fallback (callback queue or voicemail) is mandatory (M07-44).

## Data volume

Launch scope is deliberately modest: "single-level escalation chains as data; advanced call-control remains a designed seam, not shipped behaviour" (§M07.8 behavior detail, OD-7). Design for an ordered list of rules built from six condition kinds and six actions, each chain ringing level by level with timeouts and a terminal fallback.

## Numbers carrying provenance

- Per-level timeouts in escalation chains — tenant-configured data values.
- Routing policy version identifiers — recorded system facts (versioned-append).
- No money figures appear on this screen.
