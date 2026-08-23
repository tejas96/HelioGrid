# SCR-M07-16 · IVR Flow Editor

List-based per-tenant inbound flow: greeting, menu, routes, business-hours branches.

**Module:** M07 · Sales Execution · **Personas:** EPC Owner (IVR flow editing rides `F2.M01.configure-agent`, §M07.9 permissions) · **Context of use:** web emphasis for setup. The flow is "the tenant's front door" (§M07.9 behavior detail).

## Entry & exit

Reached from: the tenant-configuration settings area — the settings surface list and placement are `M01-57`'s; the exact path is not pinned by PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision. Cross-surface facts the PRD pins: the business-hours switch reuses the calling-window control (M07-47 — SCR-M07-06's control, within the floor); the menu routes to the same ring groups and presence the routing layer uses, and "route to AI agent" engages the same agent with the same gate (§M07.9 behavior detail).

## Requirements (verbatim)

### prd/modules/M07-sales-execution.md

- **M07-47** (P0) — **Inbound call routing is tenant-visible configuration, not code: a per-tenant flow — greeting → menu → route to AI agent / human ring group / voicemail — with business-hours branches.** The editor is a **list-based step editor, not a canvas**: ordered menu items (key → destination), a business-hours switch reusing the calling-window control (within the floor), per-language greeting text with spoken preview. Flows are versioned like agent config and published whole. _(non-UI half, build-side: flows versioned and published whole; in-flight calls keep their version — for awareness, not for drawing)_

## States

- **Loading** (base) — the flow while it fetches.
- **Empty** (base) — a tenant with no published flow; the editor must teach the greeting → menu → route shape, never render blank.
- **Error** (base) — save/publish failure acknowledged honestly.
- **per-language-greeting-spoken-preview** — greeting text edited per language, heard via spoken preview before publish (M07-47).
- **business-hours-branch** — the flow branching on the business-hours switch, which reuses the calling-window control within the floor (M07-47).
- **publish-versioned** — publishing versions the whole flow like agent config; in-flight calls finish on the version they started (M07-47).
- **fallback-route** — the flow's fallback route for undefined key presses: "re-prompt, then the flow's fallback route; never a hang-up by omission" (§M07.9 edge case).

## Data volume

A single per-tenant flow: greeting, an ordered menu of key → destination items, business-hours branches, and a fallback route (M07-47). Greeting text is per-language tenant data — the agent speaks six languages at launch, so the editor must hold per-language greeting variants for the tenant's offered subset (§M07.9 localization: "IVR greetings and menus are per-language tenant data with spoken preview").

## Numbers carrying provenance

- Business-hours times on the branch — tenant-configured data within the statutory floor (the calling-window control's values).
- Flow version identifiers — recorded system facts (versioned, published whole).
- Menu key digits are structure, not provenance-tiered figures. No money figures appear on this screen.
