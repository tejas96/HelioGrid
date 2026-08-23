# SCR-M04-10 · Survey Detail (Hand-off Brief)

The survey read as a complete brief: groups with provenance, photos, absences, gaps, constraints, versions, pinned tile.

**Module:** M04 · Survey · **Personas:** Design Engineer (primary reader — a submitted survey is the designer's brief), Project Manager (reads access and site constraints), Sales Manager, EPC Owner, Sales Executive, Survey Engineer · **Context of use:** "The hand-off is a screen, not a payload: the designer opens the survey and reads it the way a colleague would brief them" (M04 §M04.12 behavior detail). Desk-first reading surface; web is a review surface, mobile renders it whole.

## Entry & exit

Reached from: the designer's notification that a survey is ready (M04-52 — fired from the applied submission), or from the lead/site within the reader's visibility scope (`M04-61`: visibility follows the lead or site). Leads to: starting a design in `modules/M05-design-studio.md` — detected geometry crosses only as the validated artifact (M04 §M04.12); a designer wanting a fact the survey does not hold can raise it as a gap on the survey, which routes to ask-the-customer or capture-on-site like any other (M04 §M04.12 edge cases); prior versions are reachable from the current one, in full, with their photographs (M04 §M04.11 behavior detail).

## Requirements (verbatim)

### prd/modules/M04-survey.md

- **M04-28** (P0) — **Every remote-survey fallback is recorded on the survey and travels to the designer.** Which path produced this roof — detected and accepted, detected and adjusted, or outlined by hand after a coverage or detection failure — is part of the survey record, visible on the survey and in the hand-off, because it is the single most useful thing the designer can know about how much to trust the outline. _(non-UI half, build-side: roof-origin path recorded on the survey record — for awareness, not for drawing)_
- **M04-44** (P0) — **Access constraints are captured as constraints and reach the designer before design begins.** Where the roof cannot be reached at all — no stairs, a locked terrace, a lane too narrow for a truck, a crane needed — that is recorded as an access constraint on the survey rather than as a failed visit, and it is one of the first things the hand-off shows, because it changes what can be designed and how it will be installed.
- **M04-57** (P0) — **Surveys are versioned-append: a revisit inserts a new version and nothing is overwritten.** A return visit to a site creates a **new survey version**; earlier versions are immutable and remain readable forever, and the person on the roof is told what just happened in one line — *"v2 — v1 kept"* (`F4-25`). The first survey is evidence of what the site looked like on that day and no later visit may erase it. The survey's own states are **draft → in progress → submitted → superseded**. _(non-UI half, build-side: versioned-append immutability; states draft, in-progress, submitted, superseded — for awareness, not for drawing)_
- **M04-63** (P0) — **A submitted survey hands the designer a complete, named brief — not a folder.** The hand-off carries, as one readable thing: the **five capture groups** with every value and its provenance (`M04-35`); every **photograph** with its tag, source and pin (`M04-54`); the **flagged and skipped** items stated as named absences (`M04-51`); the **open gaps** with their states (`M04-31`); the **access constraints** (`M04-44`); the **sanctioned load** (`M04-45`); the **structural observations** as observations (`F8-25`); and, for a remote survey, the **pinned tile**, the **reviewed roof** and the **per-detection confidence and provenance** (`M04-10`, `M04-16`, `M04-18`).
- **M04-64** (P0) — **The designer receives what the survey knows and what it does not — with equal prominence.** A missing meter photograph, a waived gap, a skipped step, a low-confidence detection accepted unchanged and an inaccessible roof are all first-class content of the hand-off, not omissions the designer must notice. The absence of a fact is a fact.

Supporting behavior from the same doc (M04 §M04.12 behavior detail): the brief reads in order — here is the roof, here is what it is made of, here is what shades it, here is where the meter is and what it says, here is how material gets up there, here is what I could not check, here is what I was unsure about — with the photographs inline against the group they belong to. The remote survey's hand-off adds the pinned tile and the reviewed roof, and is explicit about how the roof came to be: detected and accepted, detected and adjusted, or drawn by hand (M04-28). `Superseded` is what a version becomes when a newer one is submitted for the same site — it is never deleted and its documents keep referring to it (M04 §M04.11 behavior detail). Structural content renders as observations with photographs, never a verdict, score or adequacy implication (`F8-25`).

## States

- loading
- empty
- error
- remote-brief-with-tile (pinned tile, reviewed roof, per-detection confidence and provenance, roof-origin path stated)
- gaps-open (open gaps listed with their states; waived gaps with author and reason)
- versions-history (prior versions reachable in full, with their photographs)
- superseded (an older version read after a newer one is submitted; never deleted)
- raise-new-gap (designer raises a fact the survey does not hold as a gap)

## Data volume

The complete brief: five capture groups with every value, all photographs inline against their groups with tag, source and pin (the PRD's scale: a survey of around 12 photographs), the open gaps (up to the five remote gaps with states), access constraints, structural observations, and — for a remote survey — the pinned tile with the reviewed roof and its per-detection confidences. Plus a version history (v1 remote, v2 physical is the PRD's common case).

## Numbers carrying provenance

Every value in the five capture groups renders with its per-field F8 tier — remote = `derived`, physical = `measured`, person-estimated = `estimated`, per field, never per survey (`M04-34`, `M04-35`):

- Roof dimensions, pitch, azimuth, area — per-field tier; for remote roofs, per-detection confidence and provenance beside each (`M04-16`, `M04-18`)
- Meter reading, sanctioned load, existing load — person-entered figures with their tiers; the sanctioned load is the design's soft-cap input (`M04-45`)
- Obstruction heights — `estimated`, person-entered
- Imagery tile capture date and the remote-unreliable mark where the roof changed (`M04-13`)
- Per-detection confidence values — persistent visible content, never colour alone (`F8-07`)
- Capture and submission times, visit dates, version numbers and states — attributable display facts (capture time is preserved for display and audit only and orders nothing, `F4-19`)

No structural number, score or adequacy figure exists anywhere on this screen (`F8-25`).
