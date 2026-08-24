# SCR-M04-01 · Survey Mode Chooser

Offer remote vs physical as two distinct offers with the segment's mode rule stated.

**Module:** M04 · Survey · **Personas:** Sales Executive, Sales Manager, EPC Owner, Survey Engineer, Design Engineer · **Context of use:** the moment a survey starts — a rep at a desk during or just after the first call, or on a phone outside a customer's house. Mode A is web-emphasis, mobile-complete (per M04 §2 Personas & surfaces), so this chooser must work whole on both.

## Entry & exit

Reached from: the lead, or from the surveys surface — "The mode is chosen at the moment a survey starts, from the lead or from the surveys surface" (M04 §M04.1 behavior detail). The choice is presented as two clearly different offers rather than a radio-button setting: *survey this roof now, from here* and *book someone to go*. Leads to: the remote offer opens Mode A address entry (SCR-M04-02); the physical offer books a visit (the booking act is `modules/M02`'s, `M02-46`; the visit object is M04's). Rule 3 fires reactively at coverage failure (SCR-M04-04); rule 4's question is asked at address confirmation, not here.

## Requirements (verbatim)

### docs/prd/modules/M04-survey.md

- **M04-05** (P0) — **Which mode, when — five rules, carried whole, surfaced as guidance rather than enforced as a lock.** (1) **Residential, simple roof** → remote is the default first pass; physical after interest. (2) **Commercial & industrial, large or complex** → start remote, and physical **always before quoting**. (3) **No roof-data coverage for the address** → remote is not possible; physical is required (§M04.4). (4) **Roof recently modified** → remote is unreliable; physical is required. (5) **Before installation** → remote is *"never enough"*; physical always. The product states the applicable rule where the mode is chosen and where a proposal is built on a remote-only survey; it does not silently pick for the operator. _(non-UI half, build-side: five mode-choice rules; guidance stated, never enforced as lock — for awareness, not for drawing)_

Supporting behavior from the same doc (M04 §M04.1 behavior detail): the lead's segment (`M02-05`) selects which rule the product states first — residential leads open on remote, commercial & industrial leads open on remote **with rule 2 stated on the same screen** ("a physical survey is required before this is quoted"). A survey started in one mode may be completed in the other, and starting the other mode is always available and never destroys the first.

## States

- loading
- empty
- error
- normal (residential lead: remote stated as the default first pass)
- commercial-rule-2-stated (C&I lead: rule 2 stated on this same screen)
- coverage-failed-rule-3 (rule 3 stated reactively after a coverage failure)
- recently-modified-rule-4 (rule 4's "yes" answer marks remote unreliable and offers to book a visit)

## Data volume

Minimal: two offers plus one stated rule for the lead's segment. No lists on this screen.

## Numbers carrying provenance

None — this screen states the two offers and the applicable mode rule; it shows no user-visible figures, money or dates. (Any figures downstream carry F8 tiers on their own screens.)
