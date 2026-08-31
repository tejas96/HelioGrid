# SCR-M01-06 · Setup — You're Ready

Onboarding exit offering exactly two doors: create first lead or open the demo project.

**Module:** M01 · **Personas:** EPC Owner · **Context of use:** the final moment of company onboarding — laptop-leaning but fully mobile-capable (M01 §2). The happy path it closes: sign up → pick what you sell → skip the rest → land on an empty Leads screen that teaches → first lead created in under a minute (M01-26).

## Entry & exit

Reached from: the end of the onboarding sequence, after the skippable invite step (M01 §M01.3 behavior detail: signup fields → M01-23 → skippable M01-24 → skippable invite → "the two-door landing (M01-26)"). Leads to: door one — the empty Leads screen that teaches, with quick-add owned by `docs/prd/modules/M02-crm-and-leads.md` (M01-26); door two — the demo project, a finished, realistic market-pack project pre-loaded through survey, design and proposal, labelled demo everywhere (context: M01 §M01.3 / M01-27, not a row of this slice).

**Decisions made in design (2026-08-28) — later screens inherit them.**

1. **`two-doors` and the default are one frame.** This screen holds no record, no list and no form — there is no version of it that is loaded and *not* showing exactly two doors. A second identical frame under a different caption would claim a distinction the product does not have.
2. **Two cards, each carrying its own act** — the tap that chooses is the tap that goes. One primary act with the demo as a text link beneath demotes the second door to a footnote, which the row's own word *doors* rules out; two option cards with a shared Continue grows a third control whose only job is to confirm a choice already made by tapping.
3. **Ranked by the act, not by the card.** `M01-26`'s happy path runs through the lead door, so it is first and takes the near-black primary; the demo door is the same surface at the same size with a secondary act. Both are legitimate first moves — shrinking one into a lesser tile would be the screen deciding for the owner.
4. **The whole card is not a target.** One control per door, and it is the button. A card that is also a button, with a button inside it, gives one act two hit boxes and two focus stops.
5. **No summary of setup and no third way out.** The corridor behind this screen is made of skippable moments, and closing it with a checklist of what was left undone turns the last screen of onboarding into a list of the owner's refusals. Each skipped part already names its own way back on `SCR-M01-05`.
6. **Door one navigates; it does not open a quick-add form here.** Quick-add belongs to `M02`, and a create sheet on this screen would be a second owner for a field set the leads screen already owns.
7. **Door two labels the door as well as the destination**, so the `Demo` mark is on screen before the tap.
8. **Not pinned by PRD — decided here: this screen is not reachable again.** It is a corridor exit, not a destination. Nothing in the shell points back at it, and both doors stay permanently available inside the app — quick-add from the arc bar's centre action, the demo project from the projects list until it is removed. Written down so no later screen invents a *back to setup* route to a screen with nothing left to do.
9. **The company name is read back, not asked** — the one tenant fact on the frame, because *you're ready* is worth attaching to a company rather than to nobody.
10. **The under-a-minute promise is cut, not tiered.** `M01-26`'s own prose invites *a first lead in under a minute* onto the surface; the moment it lands it is a user-visible quantity with no honest tier — nobody measured this owner's minute, and `estimated` on a claim about the product's speed reads as marketing. What survives is the fact behind it, which owes no tier: *a name and a phone number is enough*.
11. **The desktop room is refused three times, and each refusal is a parity argument.** A demo-project preview is information, so having it at 1536 and not at 375 is a capability gap — drawn at both widths or at neither. A setup-summary column is the same defect in the other direction. Quick-add inline is still `M02`'s field set.


## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-26** (P0) — **"You're ready" offers two doors: create your first lead, or open the demo project.** The happy path holds: sign up → pick what you sell → skip the rest → land on an empty Leads screen that teaches → first lead created in under a minute (quick-add itself is `modules/M02-crm-and-leads.md`'s).

## States

Base: **loading** · **error** *(in two forms — see below)*. **`empty` resolves to the default and gets no frame (settled 2026-08-28):** empty is a container with nothing in it, and this screen's container is two constants — no list, no record, no count that can reach zero. Same resolution `SCR-M01-03`, `-04` and `-05` reached.

**`error` splits in two, because the screen has two independent failures and one frame cannot answer both honestly (amendment 2026-08-28, from the design):**

- **error-nothing-opens** — the workspace cannot be reached. **The one state where a wall is the honest answer:** both doors are server acts, so offering either would be a promise the screen cannot keep. The doors are **absent, not dead** — a disabled pair of pills is two controls saying nothing twice. One retry, plus a line saying the company is set up, so the owner does not read a fetch failure as a lost signup.
- **error-demo-unavailable** — only the demo project is missing. **One door failing is not the screen failing:** door one is untouched, full size, still recommended; the demo door states what happened in its own card and offers its own retry. Nothing is disabled — a greyed-out door cannot say why, and `N4` forbids disabled as the only signal.

Screen-specific:

- **two-doors** — exactly two doors: create your first lead, or open the demo project (M01-26). Analytics distinguishes which door is taken ("first-lead door vs demo door taken" — M01 §M01.3 analytics).

## Data volume

Two doors. Nothing else — this screen is the exit of a sequence of skippable moments, not a summary of setup.

## Numbers carrying provenance

None — this screen shows no user-visible number, money amount or date.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
