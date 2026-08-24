# SCR-M04-05 · Gaps to Fill

End every remote survey by naming the five things remote could not establish, each with a route to resolution.

**Module:** M04 · Survey · **Personas:** Sales Executive, Design Engineer, Sales Manager, EPC Owner, Survey Engineer · **Context of use:** the required last screen of every remote survey, read by the rep before they promise anything to a customer — each gap is a plain sentence a rep can read aloud on a call (M04 §M04.5 behavior detail). Desk or phone.

## Entry & exit

Reached from: the end of the remote survey flow — "the remote survey ends on a **'Gaps to fill'** screen" (M04-29), after the Remote Roof Review (SCR-M04-03). It is part of the flow, not a modal to dismiss. Leads to: **ask the customer** produces the question as a customer message and routes it onto the transactional lane — with the tenant's transactional channel connected it sends automatically from that channel under the transactional template class with honest delivery states, and with no channel connected it is composed for the rep to send (on their next call or from their own device) and no delivery is claimed (M04 §"No survey-side send machinery of its own": *"an ask-the-customer question's follow-up — rides the transactional lane: automatic from the tenant's connected channel, composed for a person to send where none is connected, with no delivery claimed on that fallback"*; owner ruling 2026-08-04, Q33; `M03-03`, `M04-58`, `M02-47`); **capture on site** adds the gap to a visit — booking a visit pulls the open capture-on-site set into that visit's guided flow (M04-32 → SCR-M04-07); the survey then proceeds to design/proposal with open gaps travelling (M04-33 is the build-side of that travel; the proposal surface is `modules/M06`'s).

## Requirements (verbatim)

### docs/prd/modules/M04-survey.md

- **M04-29** (P0) — **What a remote survey cannot determine is stated on screen, as a required part of the flow.** Not a help article, not a footnote at proposal time: the remote survey ends on a **"Gaps to fill"** screen listing what it could not establish. The list exists because the honest limits of a remote survey are exactly the facts a rep needs before they promise anything to a customer.
- **M04-30** (P0) — **The list is the source's five, carried whole:** (1) **the meter, the sanctioned load, the main panel and whether it has room**; (2) **roof condition, age, waterproofing, structural doubts**; (3) **access — stairs, lift, crane, lane width for a truck**; (4) **shading from anything not visible from above** — *"a neighbour's wall, a tree at ground level"*; (5) **whether the customer actually owns that roof**. No remote survey is complete without this list being presented, and no item may be dropped from it because a detector produced *something* nearby.
- **M04-31** (P0) — **Every gap is a first-class record with exactly four resolutions: ask the customer · capture on site · resolved · waived.** A gap is not a checkbox and not a note — it has a state, an owner and a history. Resolving one records what was established and by whom; waiving one records who waived it and why. Open gaps are visible on the survey, on the lead and in the hand-off to the designer until they are closed. _(non-UI half, build-side: gap record: four resolutions, owner, history, audited waivers — for awareness, not for drawing)_
- **M04-32** (P0) — **Booking a physical visit pulls the open capture-on-site gaps into that visit's guided flow.** The gaps a remote survey could not close become the visit's agenda: the guided capture opens with those steps present and marked as the reason the visit exists, so the surveyor cannot arrive without knowing what the desk could not answer.

Supporting behavior from the same doc (M04 §M04.5 behavior detail): **resolved** records what was established — the customer confirmed the sanctioned load from their bill, the customer sent a photograph of the meter; **waived** records a reason and the waiver is visible to the designer — a waived gap is never silently equivalent to an answered one. Gap 5 maps directly onto the lead's roof-ownership qualification answer (`M02-39`) and where that answer already exists the gap is pre-resolved from it rather than asked twice. Gaps may all be waived with reasons, but they are shown.

_Annotation (not a rewrite of the quoted source): this note was opened because that same §M04.5 behavior-detail paragraph **previously described** **ask the customer** as "the product composes, a person sends, `D32` via `M02-47`" — the prior wording is quoted here for traceability only. **The gap this note was opened for is closed.** That paragraph now reads that **ask the customer** "composes the question and puts it on the transactional lane like every other message this module produces — where the tenant has a connected channel it sends from that channel under the transactional template class with honest delivery states, and where none is connected it is composed ready to paste for the rep to send themselves on their next call, that fallback alone claiming no delivery; owner ruling 2026-08-04, Q33, via `M02-47`", and it carries its own reconciliation record naming the superseded wording. Owner ruling 2026-08-04 (Q33) retired `D32`'s manual-only rule and `M02-47` now sends through the tenant's connected transactional channel. **No divergence is outstanding for the PRD owner on this row:** the Entry & exit line above, the two ask-customer states below, the module's behavior detail and M04's own §"No survey-side send machinery of its own" all state the same two-branch behavior._

## States

- loading
- empty (note: the list itself is never empty by construction — all five items are always presented; "empty" here can only mean the record has not loaded)
- error
- all-open
- ask-customer-sent (connected transactional channel: the question sent from the tenant's channel under the transactional template class, with its delivery state shown honestly)
- ask-customer-composed (no connected channel: question composed for the rep to send; no delivery claimed)
- capture-on-site-added (gap added to a visit's agenda)
- resolved (what was established and by whom recorded)
- waived-with-reason (who waived and why recorded; visible to the designer)
- ownership-pre-resolved-from-lead (gap 5 pre-resolved from `M02-39`'s qualification answer)

## Data volume

Exactly five gaps, each carrying one of four resolution states, an owner and a history. Design at all five open (the default end-state of every remote survey) and at mixed states.

## Numbers carrying provenance

None rendered as facts — this screen names absences, not figures. The sanctioned load, dimensions and shading heights the gaps refer to do not exist yet; when a gap is resolved, what was established is recorded with its actor (build-side of M04-31). Any open-gap count shown travels with the survey as a count, not a measured figure.
