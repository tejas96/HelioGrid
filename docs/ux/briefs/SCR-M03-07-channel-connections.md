# SCR-M03-07 · Channel Connections

Settings-class surface (M01 pattern, reached from here): connect/disconnect tenant-owned channel identities with honest state machine and requirements.

**Module:** M03 · Marketing · **Personas:** EPC Owner (`F2.M03.manage-channel-connections`, EPC Owner only — connects, reconnects and disconnects, because a channel identity is the tenant's own name and reputation), Marketing (reads channel state via `F2.M03.campaign-visibility`, cannot connect or disconnect) · **Context of use:** a settings-class act at a desk; connection has a single shape across channels so a tenant learns it once — choose the channel → see what connecting requires → connect → the state machine takes over (M03 §M03.3 behavior detail).

## Entry & exit

Reached from: this module — "Channel connection is a settings-class surface and lives with `modules/M01`'s tenant configuration pattern (`M01-58`), reached from here" (M03 §2). Leads to: each channel's connection flow (choose channel → requirements → connect); disconnection passes through a confirmation that names what will stop and what will remain (`M03-27`). Other routing not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M03-marketing.md

- **M03-19** (P0) — **A channel connection has an honest state and is never advertised before it exists:** `not connected` · `connecting` · `connected` · `action needed` (registration pending or rejected, credential expired, permission revoked at the provider) · `disconnected`. A channel the tenant has not connected is shown as connectable, with what connecting requires — never as a working feature. A channel this market's pack cannot support is shown as unavailable **for this market**, with that reason. **Form-bearing channels have one more connectability condition (owner ruling 2026-08-04, Q35):** a lead-capture form without a required phone field **cannot be connected** — the connection flow refuses it and names the missing field (`M03-33`). _(non-UI half, build-side: connection state machine; forms without required phone field refused connection (Q35) — for awareness, not for drawing)_
- **M03-27** (P0) — **A channel is disconnected by the tenant, at will, and disconnection is honest about consequences.** Disconnecting stops new sends and new captures on that channel immediately; it never deletes what the channel already captured, never alters a lead's source badge, and never rewrites a completed campaign's report. The confirmation names what will stop and what will remain. _(non-UI half, build-side: disconnect never deletes captures, badges or completed reports — for awareness, not for drawing)_
- **M03-28** (P0) — **A channel that breaks mid-campaign pauses the campaign and says so.** Credential expiry, revoked permission at the provider, or a channel-side rejection moves the connection to `action needed` (`M03-19`), pauses every `sending` campaign on it at `paused` with that reason (`M03-09`), and notifies the campaign owner and the EPC Owner. Sends already made stay made; sends not yet made are not silently dropped — they wait, and the report states how many are waiting. _(non-UI half, build-side: break detection pauses sending campaigns, notifies owner; unsent messages wait — for awareness, not for drawing)_

## States

- **loading**
- **empty** — nothing connected yet: every channel shows as connectable with what connecting requires, never as a working feature (`M03-19`).
- **error**
- **not-connected** — shown as connectable, with what connecting requires — never advertised as working (`M03-19`).
- **connecting**
- **connected**
- **action-needed** — registration pending or rejected, credential expired, permission revoked at the provider (`M03-19`); a break here pauses every `sending` campaign on the channel with that reason and notifies the campaign owner and the EPC Owner (`M03-28`).
- **disconnected**
- **unavailable-for-market** — a channel this market's pack cannot support is shown as unavailable **for this market**, with that reason (`M03-19`).
- **form-refused-missing-phone** — a lead-capture form without a required phone field cannot be connected; the connection flow refuses it and names the missing field (`M03-19`, owner ruling Q35).
- **disconnect-confirmation** — names what will stop (new sends and new captures, immediately) and what will remain (everything already captured, source badges, completed campaign reports) (`M03-27`).
- **marketing-read-only** — Marketing holds `F2.M03.campaign-visibility` and not `F2.M03.manage-channel-connections` (EPC Owner only): "Marketing reads channel state (`F2.M03.campaign-visibility`) and cannot connect or disconnect" (M03 §M03.3 permissions). They see each channel's honest state — `not connected` · `connecting` · `connected` · `action needed` · `disconnected`, and `unavailable for this market` with its reason (`M03-19`) — as state alone, with no Connect, Reconnect or Disconnect control present or reachable in any form, enabled or disabled. What connecting requires is still readable as a fact about the channel rather than as an affordance, and the screen names whose act connecting is. The same screen, scoped (`F2-12`) — no second layout, no richer or thinner rendering of the same states.
- **marketing-read-only-action-needed** — the same reader on a broken channel: they read the `action needed` reason and the pause it caused on their `sending` campaigns, and the reconnect is not theirs to perform (`M03-28`, `M03-19`); the campaign owner and the EPC Owner are the ones notified.

## Data volume

Design at the module's full channel set — the brief names email, WhatsApp, Facebook, Instagram and SMS, plus the website form, with inbound voice appearing as `modules/M07`'s live capture channel (M03 §1, §M03.3) — each entry carrying its own connection state, its requirements, and where relevant a registration whose clock is the channel's, not ours.

## Numbers carrying provenance

Each of these renders with its F8 provenance tier in the design:

- The campaigns affected by a disconnect, as named in the confirmation's "what will stop" (`M03-27`)
- How many unsent messages are waiting when a broken channel pauses `sending` campaigns (`M03-28`)

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state and a Context-of-use clause stating connection was online-only (register `Q15`). Both are deleted. The channel connection state machine is about remote identities, not device connectivity, and is untouched.*
