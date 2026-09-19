# SCR-M07-13 · Call Record Detail

The full call record reached from the lead timeline or My Day deep-link: outcome, summary, transcript, recording, config version.

**Module:** M07 · Sales Execution · **Personas:** Sales Executive (mobile-first — reads results on their own leads, corrects the agent's read), Sales Manager (team leads), EPC Owner · **Context of use:** phone in field for reps checking what the agent did overnight; correcting a call's outcome rides lead visibility (`F2.M02.lead-visibility` scope, §M07.5 permissions).

**One job:** see what happened on this call — and correct the agent where it read it wrong.
**Order of attention:** 1 the outcome, the interest and the one-line summary · 2 the transcript and the recording · 3 the facts of the call.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **The transcript is content and is never counted.** The screen's own words are labels and chips.

| Fact | Kind | Its form here |
|---|---|---|
| The outcome and the interest signal (`M07-38`) | status | two chips at the head of the record, each from its fixed set |
| The one-line summary (`M07-38`) | data | content, as written |
| The rep's correction wins (`M07-25`) | action · data | ONE act — correct. The corrected values are what shows, and one row leads to the agent's original read |
| The transcript (`M07-38`) | more detail | opens on a tap, in the call's language, the language as its label. It never holds the summary back while it loads |
| The recording (`M07-38`) | action · status | a player where one exists. Where the customer declined, or the recording has passed its retention date, a chip says which, and the transcript stays |
| The facts of the call (`M07-38`) | data | label–value rows: time and duration, language, that the disclosure played, the agent version, and the phone-menu steps where there were any |
| A dropped call | status | its outcome chip says so. The record is always written |
| The record cannot be found | error | one banner. Never blank fields |

## Arrangement

- **375.** The chips and the summary first, then the rows, then the transcript and the recording as
  rows that open.
- **1536.** The facts and the recording on the left, the transcript open on the right as the region
  that carries the length.

## Entry & exit

Reached from: the lead timeline — the call's one-line summary sits **on the lead timeline** with transcript and recording on tap (M07-38) — and My Day's AGENT ACTIVITY block, whose entries deep-link to the call result on the lead timeline (M07-03, SCR-M07-01). Leads to: a rep correction emits a review-queue item for the owner (M07-26's loop, SCR-M07-11); other exits are not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M07-sales-execution.md

- **M07-25** (P0) — **The rep's assessment always wins.** Where the rep disagrees with the agent's read of a call — outcome, interest signal, summary — the rep's correction is what the lead shows. _(non-UI half, build-side: rep correction overrides agent read on the lead; agent original stays in history — for awareness, not for drawing)_
- **M07-38** (P0) — **Every call is ledgered — human and agent, inbound and outbound.** The record: a typed outcome — interested · callback requested · not interested · no answer · busy · wrong number · voicemail · escalated · transferred · opted out — an interest signal (hot/warm/cold/none), a one-line summary **on the lead timeline** with transcript and recording on tap, the language used, the recording-consent flag (a customer may decline and still be served), that the disclosure played, the agent-config version used, and IVR-traversal markers where they apply (§M07.9). Recording is purged at the pack's retention bound; **the transcript is retained.** _(non-UI half, build-side: every call ledgered; recording purged at retention bound, transcript retained — for awareness, not for drawing)_

## States

- **Loading** (base) — record while it fetches; transcript and recording load on tap, never blocking the summary.
- **Empty** (base) — not a natural state for a record reached by deep-link; if the record cannot be found the screen must say so honestly, never render blanks.
- **Error** (base) — fetch failure acknowledged honestly.
- **transcript-on-tap** — the full transcript open, in the call's language, labelled (§M07.7 localization).
- **recording-available** — recording playable where consented and within the pack's retention bound (M07-38).
- **recording-consent-declined** — the recording-consent flag shows the customer declined; no recording exists but the call proceeded and the transcript survives (M07-38).
- **recording-purged-retention** — recording purged at the pack's retention bound; the transcript is retained (M07-38).
- **dropped** — a call whose outcome records the honest failure; the call record is always written (§M07.7's failure-honesty context, rendered here as the record's outcome).
- **ivr-traversal-markers** — the record carries IVR-traversal markers where they apply (M07-38 — §M07.9).
- **rep-corrected** — the rep's correction is what the lead shows (outcome, interest signal, summary); the agent's original read stays in the record's history (M07-25).

## Data volume

One call record — but a dense one: typed outcome (ten-value vocabulary), interest signal (hot/warm/cold/none), one-line summary, full transcript in the call's language, recording player where it exists, language, consent flag, disclosure-played fact, config version, and IVR markers where they apply (M07-38). Design the transcript for a full conversation's length on a phone.

## Numbers carrying provenance

- Call time and duration — ledgered system facts (M07-38).
- The agent-config version used — a recorded system fact answering disputes (M07-38).
- Attempt/traversal markers ("navigated an IVR (N steps)" where they apply) — recorded facts of what happened, including what did not (M07-38, §M07.9).
- No money figure is native to this screen; anything money-like inside the transcript is the agent's spoken rendering of the product's computed values and is not re-stated by this screen's chrome.
