# SCR-MS-16 · Sign-off Review

Read-only inspection of studio and drawings; approve or return with pinned comments.

**Module:** MS (M05 Design Studio · studio sub-spec MS11) · **Personas:** Design Engineer with the approval capability (the approver — never the author), EPC Owner · **Context of use:** the Design Engineer is desktop-weighted with full mobile parity (prd/02-personas.md persona table); reviewing a whole design and its drawings is a sustained inspection task — expect desk sessions, with the mobile parity contract still holding.

## Entry & exit

Reached from: opening an entry in the Sign-off Queue (SCR-MS-15) (M05-83). **Gate that admits the user:** the capability `F2.M05.approve-designs` (M05-83), and the approver is never the author (M05-85) — not a wizard-step gate: the review surface is the read-only studio plus the drawings and is never a second wizard gate (M05-84), so the wizard's own step gates do not re-apply to the reviewer. Leads to: Approve → sign-off recorded (who + when, against design version + fingerprint) and the customer-facing state follows (M05-85, MS11-14); Return with comments → the design goes back to the designer with a notification and pinned markers in the studio at each commented object/step (M05-86, MS11-14) — markers behave like validation locate entries: tap → centre and select the commented thing (prd/modules/M05-design-studio.md §M05.14 behavior detail). Exit back to the queue is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### From prd/modules/M05-design-studio.md

- **M05-84** (P0) — **The review surface is the read-only studio plus the drawings — findings surface without blocking, and review is never a second wizard gate.** The reviewer sees exactly what the designer built (censused surfaces, read-only) with the readiness card, validation list, engineer-confirmation flags (bridging, platforms, high-wind) and honesty state composed for review.
- **M05-85** (P0) — **Approve records structural verification — Engineer approved, with who and when — pinned to exactly what was reviewed (design version + fingerprint).** A design edit after approval (fingerprint mismatch) drops sign-off back to draft; sign-off decisions are append-only, and re-approval reviews the new state. The approver is never the author (`F2-04`, cited; one-person-tenant exception recorded there). _(non-UI half, build-side: append-only sign-off pinned to version+fingerprint; edit drops approval to draft — for awareness, not for drawing)_
- **M05-86** (P0) — **Return with comments requires at least one comment pinned to the thing it refers to — an object or a step, never a loose note.** The design goes back to the designer with a notification (`foundations/F6`'s type registry) and **pinned markers in the studio** at each commented object/step; the designer resolves and resubmits; the customer never sees the returned design meanwhile. _(non-UI half, build-side: ≥1 pinned comment required; customer never sees returned design — for awareness, not for drawing)_

### From prd/modules/M05-studio/10-done-and-installation.md

- **MS11-14** (P0) — A review surface lets the engineer inspect the design read-only (studio + drawings) and either APPROVE — recording who, when and against which design version — or RETURN WITH COMMENTS pinned to the object or step at issue, notifying the designer (UXG-07, F8-25). _(non-UI half, build-side: records who/when/design-version on approve; notifies designer on return — for awareness, not for drawing)_

## States

Three base states, then every screen-specific state from the slice and the rows:

- **loading** — the composed read-only studio and drawings load; never a blank review.
- **empty** — a queued design that cannot be composed for review states so honestly; the queue only feeds real designs, so true emptiness is an error-adjacent state, not a norm.
- **error** — the review cannot load or a decision cannot record; states plainly what happened.
- **read-only-inspect / read-only-composed** — the read-only studio plus the drawings: censused surfaces exactly as the designer built them, with the readiness card, validation list, engineer-confirmation flags (bridging, platforms, high-wind) and honesty state composed for review; findings surface without blocking (M05-84, MS11-14).
- **approve-confirm** — the approve act: recording structural verification, who + when, pinned to design version + fingerprint (M05-85, MS11-14).
- **approve-recorded** — Engineer approved recorded; append-only, and a later edit (fingerprint mismatch) drops sign-off back to draft (M05-85).
- **return-with-comments** — composing a return: every comment pinned to the thing it refers to — an object or a step, never a loose note (M05-86, MS11-14).
- **return-refused-no-comment** — a return with zero pinned comments is refused; the requirement is stated (M05-86).
- **pinned-comment-markers** — pinned markers in the studio at each commented object/step; each marker locates its target (M05-86).
- **author-approval-refused** — the approver is the author → refused per `F2-04` (one-person-tenant exception recorded there) (M05-85).

## Data volume

Design at the Definition of Done's realistic volume: the read-only studio and drawings of a 221-panel design; a validation list and engineer-confirmation flags at realistic counts, not one token entry; a return carrying several pinned comments across different objects and steps.

## Numbers carrying provenance

Each user-visible number carries its F8 provenance tier in the design:

- Figures composed read-only from the studio (readiness card, validation list counts, flagged items) keep the tiers they carry on their home surfaces (M05-84)
- Approval record: who + when timestamp, and the design version it is pinned to (M05-85, MS11-14)
