# SCR-M01-12 · Team

People with role chips, status, last-active; one-tap invite, deactivate, revoke; session revocation surface.

**Module:** M01 · **Personas:** EPC Owner · **Context of use:** team and role administration is EPC Owner-only (`F2.M01.manage-team` — M01 §2, §M01.2 permissions; the Team screen's read view follows the same grant in v1). The settings suite is web-emphasis, but one-tap acts — invite, deactivate — are first-class on mobile (M01 §2). This is also the session-revocation surface: deactivating a user, or a user's own "sign out everywhere", kills every device's session within ≤10 minutes (context: M01 §M01.1 / M01-07, not a row of this slice).

## Entry & exit

Reached from: the tenant administration area — the precise navigation is not pinned by PRD — designer decides, note the decision. Leads to: one-tap invite → Invite Teammate (SCR-M01-07); a person's role administration → Assign Roles (SCR-M01-13); the read-only Roles Reference (SCR-M01-14) sits beside these role-administration screens (M01 §M01.2). Revocation of a pending invite is one tap on this screen (M01 §M01.2 behavior detail).

An active member's whole row opens Assign Roles; at 1536 it carries no chevron, and the build gives it a keyboard focus stop. An invite row and a deactivated row carry no row tap: Assign Roles refuses anyone who is not active, and an invite has no membership to edit (owner ruling 2026-10-16).

## Requirements (verbatim)

### From `docs/prd/foundations/F2-roles-and-permissions.md`

- **F2-10** (P0) — **One person can hold several presets — stacking is the design.** The census states it: "Six fixed preset roles; one person may hold SEVERAL. Permission granted if any held role grants it; lead visibility takes the widest" (D27 — the count widens to twelve per DD3, the law is unchanged). The small-firm problem — one person is rep *and* surveyor *and* designer — is solved by stacking, never by building a custom role. The team list shows all roles a person holds as chips. _(non-UI half, build-side: stacking law: one person holds several presets, composed by OR — for awareness, not for drawing)_
- **F2-19** (P0) — **A tenant always retains at least one EPC Owner, and at least one person holding Manage team.** An owner removing their own admin rights, or the removal of the last Manage-team holder, is blocked with an explanation. Enforced as guarded transitions, not UI-only. _(non-UI half, build-side: guarded transition enforced beyond UI; blocked attempts audit-logged — for awareness, not for drawing)_

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-19** (P0) — **The Team screen** lists people with their role chips (all presets held, per F2-10), status (invited / active / deactivated) and last-active; one-tap invite and one-tap deactivate; deactivation warns about open work and prompts reassignment (F2-20). Blocked guard-rail attempts (removing the last EPC Owner or last Manage-team holder) explain themselves (F2-19) and are audit-logged (F2-22).

## States

Base: **loading** · **empty** · **error**.

Screen-specific:

- **normal** — people with role chips (all presets held), status (invited / active / deactivated), last-active; one-tap invite and one-tap deactivate (M01-19, F2-10).
- **empty-teaching** — before anyone is invited, a teaching empty state per F7's empty-state contract (M01 §M01.1 behavior detail pattern), inviting the first teammate.
- **guard-rail-blocked** / **guard-rail-blocked-explained** — removing the last EPC Owner or last Manage-team holder is blocked with an explanation and the blocked attempt is audit-logged (F2-19, M01-19; M01 §M01.2 acceptance).
- **deactivate-confirm** — the confirm states only that the person loses access and that their history stays theirs. Reassigning open work (leads, visits, proposals) and the open-work counts wait for the modules that own that work (M02's lead owner, M08); no bulk-reassign contract exists, so this confirm carries neither (M01-19).
- **deactivated-member** — a deactivated person's history remains attributed to them, their role chips and status render, and they are absent from assignment pickers (M01 §M01.2 acceptance).
- **pending-invite-revoke** — revocation of a pending invite is one tap on this screen (M01 §M01.2 behavior detail); invite states are pending / accepted / expired / revoked (M01-12 context, carried on SCR-M01-07).
- **expired-invite** — the list shows expired invites as well as pending ones (`GET /invitations` returns both; M01-12). An expired row carries the status Expired and the act *Invite again*, which sends a new invite.
- **query** / **filter** — *Find in this list* narrows the list by name, and the Status chips (All, Invited, Expired, Active, Deactivated) narrow it by status, each chip counting what the search matches.
- **invite-again-refused** — *Invite again* answered 422 or 429 leaves the card as it was and says why in a danger toast, in the shipped words for the code (`packages/i18n/src/copy/api-error.ts`); a 409 refreshes the list instead.
- **no-match** — a search that matches no one: the list is the system's `EmptyState` naming the words — *No one matches "<text>"* — with *Clear search*; the status chips count what the search matches (owner ruling D2 A).

Drawn at 375 only (at 1536 the phone's answer holds at width): `empty-teaching`, `error`, `deactivated-member`, `pending-invite-revoke`, `invite-again-refused`, `guard-rail-blocked`, `guard-rail-blocked-explained`.

- **empty** cannot occur — the reader is always on the list — so **empty-teaching** answers it: only the owner so far, and the invite. It is the system's `EmptyState`, centred as its contract fixes — with **no-match**, the two exceptions to *no centred block* on this screen (owner ruling 2026-10-16; `D233`).
- **loading** draws three placeholders the size of the rows they stand for — the stacked card at 375, an 82 px row at 1536 — and no head count until the read lands. *Invite teammate* stays live in loading and in error; it does not wait on this read. **error** draws no roster and no caption.
- **deactivate-confirm** is a sheet at 375 and a centred modal at 1536 — a decision, not an editor — not dismissible, with no close button.
- **guard-rail-blocked-explained** is a refused write: the tenant changed on another device after the list was read. It renders on the confirm surface — nothing applied, what changed, the act — *Deactivate <name>*, on the board *Deactivate Rajesh* — off, with the route out *Make someone else an EPC Owner first* as its `disabledReason`, which opens in a bubble on a tap, click, focus or hover — no line is drawn under the button (owner ruling 2026-10-17, design-system change 5).
- **deactivated-member** is the after-state of the act: the row moves to the end of the list, its status reads Deactivated and its act is gone.
- Status is a word plus a dot in its tone: invited `info`, expired `warning`, active `success`, deactivated `neutral`.
- The reader's own row carries a *You* badge beside the name. At 1536 the page header counts *<n> people · <n> invites*.
- A pending invite shows its seven days as a bar, with *Day <n> of 7* and *Expires <date>* under it.
- After a deactivation lands, a neutral toast reads *<name> deactivated*. After a revoke lands, it reads *Invite to <name> revoked* · *Inviting <first name> again sends a new link.*
- **guard-rail-blocked-explained** opens with the banner *Not done — <company> must keep one EPC Owner*.
- At 375 a person is the system's `RecordCard` in its `stacked` layout, the dot drawn by `Avatar`'s `mark` (design-system change 11; owner ruling D4 A).
- At 375 a row's status line reads *Invited* (its roles are the badges under it), *Expired <date>*, *Active · last seen <date>* (or *today*) and *Deactivated · last seen <date>*; at 1536 a time today reads *Today, HH:MM*.

**Decisions made in design (2026-08-31) — later screens inherit them.**

1. **Entry is More → Team**, not pinned by the PRD. The shell fixes settings and administration to
   *More*; Team is reached the same way. *More* is the destination in force, no fifth slot.
2. **The invite act is a full-width primary at the top of the scroll, not sticky.** A sticky band
   costs ~100px permanently on a screen that is a list, a footer act collides with the shell's
   pill footer, and a text act in the top bar is the smallest target furthest from a thumb.
3. **One tap means ON the row.** *Deactivate* and *Revoke invite* sit in the card's action line, not
   behind a kebab — a menu is a second tap on an act the module calls first-class. **Each row act is
   a raised `secondary` pill with its glyph** (owner pick "A · Colour with purpose", 2026-10-17,
   design-system change 7): *Deactivate* in danger words (`tone: "danger"`), *Revoke invite* plain,
   and *Invite again* the near-black `primary` pill; a ghost text act read as plain words. At 1536
   the table sits in one raised white card with hairlines between rows. `destructive`, a red fill,
   stays the confirm's.
4. **Status is a chip; a role is not.** invited/active/deactivated is a membership lifecycle, so it is
   a word plus a dot. Presets held render as `Badge` in the iris tone of their kind — violet sell and
   lead, blue plan and run, magenta on site (design-system change 7) — never a semantic state colour,
   which a `StatusChip` would invent for an identity.
5. **The deactivated row is not dimmed.** Greyness as the signal pulls the name and both dates under
   the contrast floor; the chip carries the word.
6. **List order is invites first (pending, then expired), then everyone by name, deactivated last** — a behaviour; no caption sentence states it.
   No group headings: a heading that vanishes when its group is empty is a second answer to one
   question, and the status is already on the record (`N6b`).
7. **The `F2-19` guard is the RESTING state of the owner's own row**, not a refusal after a tap. In a
   one-owner tenant the last owner is the reader, so the owner's row keeps *Deactivate* as the same
   danger pill, disabled and focusable, at both widths — on the phone card and at 1536 — its
   `disabledReason` *Only EPC Owner* opening in a bubble on a tap, click, focus or hover; no line is
   drawn under it.
8. **Relative times are refused.** *"2 hours ago"* turns a recorded fact into a computed one. *today* is
   the date, not a span.

**Every person on this list holds at least one preset.** A member with no preset cannot exist: an
invite, a role change and a session all refuse an empty role set (F2-21; `roleSetSchema` `.min(1)` in
`packages/contracts/src/common.ts:116`). No row is drawn without a role chip.

**Two holes this screen reports rather than invents.** There is **no reactivation control** — a list
that can deactivate and never reactivate is a one-way door, and bringing someone back is not a row of
this slice. And **seven of the twelve preset names** are not on this board; they must come from `F2`'s
table, never transcribed from the frame.

## Data volume

The PRD pins no team-size number; design for the small-firm reality the stacking law names — one person is rep *and* surveyor *and* designer (F2-10) — through a list long enough to scroll, where each person may carry several of the twelve preset chips at once plus a status and a last-active value. Role names use localized capability phrases (M01 §M01.2 localization notes). Every preset chip shows whole at both widths; at 375 the chips wrap, with no cap and no *+1*.

At 1536 the list is one table — Person (with the status chip) · Roles · Last active, the row act in its own 160 px column, the other three in the ratio 2.2 : 2.4 : 1.2 (owner pick A) — filling the content width beside the settings side list (`SCR-SHELL-01`, *More: the settings list*), inside the page's own scroll, with *Invite teammate* in the page header. Its caption is for assistive technology only. No sortable headers, no selection.

## Numbers carrying provenance

No tiered value. The pending invite's expiry and last-active are dates, and a date carries no tier
(`F8-01`); the expiry carries no working line either. No money or energy figure renders here.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state (teammate list readable from cache, read-only) and a matching read-cache sentence in Context of use. Both are deleted.*
