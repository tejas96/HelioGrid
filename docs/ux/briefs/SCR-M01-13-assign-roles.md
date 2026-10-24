# SCR-M01-13 · Assign Roles

Stack F2 presets per person with a live plain-English grant line.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** an owner administering the team — the settings suite is web-emphasis (dense-list administration is desktop-first per M01 §2), with one-tap acts first-class on mobile.

## Entry & exit

Reached from: the PRD groups this screen in the Team / Assign roles / Roles reference / Invite family that renders F2's semantics (M01 §1, §M01.2), and M01-20 assigns presets "to a person" — the per-person entry from the Team screen (SCR-M01-12) is the natural path but is not explicitly pinned by the PRD — designer decides, note the decision. Only an active member's row opens this screen; an invite or a deactivated person has nothing to assign (owner ruling 2026-10-16). Leads to: back to Team (SCR-M01-12) — dismiss leaves the set unsaved, **Save roles** writes it — and, once `T-M01-014` builds the Roles Reference (SCR-M01-14), to it through a round *Roles reference* info button at the right of the *Presets* heading that opens over the editor and keeps the ticks — not drawn before then (owner ruling 2026-10-23, `T-M01-013` Decision 4); all role changes write old → new audit entries (M01 §M01.2 behavior detail, F2-22). Permission: requires `F2.M01.manage-team` (EPC Owner-only; M01 §M01.2 permissions).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-20** (P0) — **Assign roles shows a live plain-English grant line.** Assigning presets to a person renders, live, what the combination means — "Rajesh can sell, survey and design" — composed from localized capability phrases (F2 §F2.2). Stacking is the design; there is no other way to widen access (F2-10, F2-15).

## States

- **Loading** — the person's current presets and the preset list are being fetched.
- **Empty** — a mid-edit state, never a saved one: no person holds zero presets (F2-21; `roleSetSchema` in `packages/contracts/src/common.ts`, `.min(1)`). It appears when the owner clears every preset on someone's sheet. The grant line says they would hold nothing, and Save stays off until one preset is ticked, its `disabledReason` *Tick at least one preset.*, which opens in a bubble on a tap, click, focus or hover — no line is drawn under the button (owner ruling 2026-10-17, design-system change 5).
- **Error** — an assignment save fails; what happened and what to do next, per F7's contract. A `validation` banner over the grant card, titled *{name}'s roles weren't saved*, says why: nothing changed — try Save again (a failure); the person is no longer active on this team (Save then off with the same words); the company's last EPC Owner, or your own EPC Owner, which only another owner can remove. A save that got no answer is read back first: landed, the editor closes as on a save; not readable, the banner has no title and asks to check whether it saved (`F8-36`). A reader who lost Manage team leaves Team.
- **grant-line-updating-live** — as presets are toggled on/off, the plain-English grant line updates live to describe exactly the resulting grants (M01-20 acceptance).

Drawn at 375 only (at 1536 the phone's answer holds at width): `empty`, `error`, `grant-line-updating-live`, the sole-EPC-Owner guard, the after-remove undo toast.

- **Loading** keeps the header — name, status and phone came off the tapped row. The body is row-sized skeleton rows (decision 2); the grant line and Save are absent (owner ruling 2026-10-16).
- In **Error** the ticks stay as composed and Save is the retry; no second button.
- Only a save that REMOVES a preset is confirmed, and the confirm names what is leaving. One confirm, one audit entry and one undo cover the whole diff. A save that only adds goes straight through.

**Decisions made in design (2026-08-31) — later screens inherit them.**

1. **Entry is a person's row on `SCR-M01-12`**, not pinned by the PRD. `M01-20` assigns presets *to a
   person*, so the per-person entry is the natural path.
2. **Two of the brief's states are not surface states.** `empty` is a COMBINATION — the twelve presets
   always exist — and `error` is a failed save that must keep the composed ticks. Both are drawn as
   content inside a live screen rather than through the component's own `state`, which would blank the
   list in one case and discard the owner's work in the other. `loading` draws row-sized skeleton rows.
3. **`grant-line-updating-live` is drawn as a before/after pair.** A static board cannot show a
   sentence changing, so it shows the two ends of the change.
4. **The twelve presets carry `F2`'s canonical names** — all twelve, from `F2-01`'s table: `EPC
   Owner` · `Sales Manager` · `Sales Executive` · `Survey Engineer` · `Design Engineer` · `Project
   Manager` · `Field Technician` · `Installation Team Member` · `HR/Admin` · `Finance` ·
   `Operations` · `Marketing` — in `F2`'s own order. `F2-01` names the twelve verbatim and `F2-02`
   forbids renaming them, so a preset list is never transcribed from another frame.

5. **`N8` is closed with both halves** — the undo in a toast, AND the recovery route in words, on the
   confirm and again beside the undo. An undo lives for seconds; the question arrives an hour later.
   The toast is a `ToastHost`, which owns its own placement and clearance.
6. **The list behind the editor is `SCR-M01-12`'s list as its boards draw it**, at both widths (at 1536 inside
   the settings side list, `SCR-SHELL-01`) — roster, row acts, list head, page head and invite line —
   reused, never redrawn.

**The editor.** A `Sheet` over the Team list at 375. At 1536 a modal side panel over the Team table —
backdrop, focus trap and scroll lock — so a second row cannot open while a set is uncommitted. The
head — the name and its status chip on one line, the person's phone under it, in mono (`F7-09`; there is no email — owner ruling 2026-10-23, `T-M01-013` Decision 1), then *Presets* on a thin line — stays fixed while the rows scroll, at both widths. The
whole row is the control, and the list never re-sorts by what is held. One **Save roles** commits the
whole set; it is off while nothing has changed, its `disabledReason` *Tick or clear a preset first.* in the same bubble. The grant line is pinned above Save
at both widths, in a summary card on a light accent ground (owner pick "G2 · Icons lead, the
sentence is plain"; references: Dribbble *User role management* by Eugen Eşanu, *Share modal —
Untitled UI* by Jordan Hughes): at its left the held capabilities' icons as one `AvatarGroup` of
glyph discs (design-system change 18 — `Avatar` `glyph`, `AvatarGroup` `ring` in the card's ground;
at most four, then its own *+N*) — building, gauge, document, search, palette, board,
calendar-clock, house, pair, wallet, package, megaphone; decoration, hidden from a screen reader; beside it the overline
*What this gives them* and one plain sentence in body type, each capability in bold — *Vikram can
**survey**, **design** and **install**.* Nothing in the card looks like a control: no pill, no
chip, no shadow. Above it, one sentence says every change is recorded, old → new; it is not a control. The build mounts `EditorSurface`, which is the sheet at 375 and the side panel at 1536; the board mounts `Sheet` and `DetailPanel` directly only because a board has no width probe (owner ruling 2026-10-16; `D234`).

**The preset rows.** Each preset is an `OptionCardGroup` row in a multi-select mode: a title, a
description and a `disabledReason`. The `disabledReason` carries the sole-EPC-Owner guard: the last
EPC Owner cannot be unticked, and the row says why (F2-19) — a visible second line in the row, not a
bubble. One prop contract on both platforms,
shared with SCR-M01-07.

**The grant line is a whole translated sentence with slots** (owner ruling 2026-08-31), never
`name + "can" + phrases`. Each language supplies its own template and its own list joiner, so word
order belongs to the translator rather than to the code — Hindi and Marathi put the verb after the
list, which is what a concatenation cannot express. **A preset supplies a full CLAUSE, not a
fragment**: `Field Technician` reads *"can work assigned stops"* and joins cleanly. **The line drops a held
preset whose grants another held preset already covers**, so EPC Owner speaks alone. Each
combination still yields exactly the grants the F2 matrix ORs together.

## Data volume

Design at F2's full preset set: twelve presets available to stack per person (M01 §M01.2, F2-01), any combination of which may already be held. One person per assignment surface.

## Numbers carrying provenance

None — this screen shows no user-visible money, dates or computed numbers. The grant line is text composed from localized capability phrases (M01-20).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a Context-of-use sentence stating the online-only/fail-fast boundary (`F4-09`). Both are deleted.*
