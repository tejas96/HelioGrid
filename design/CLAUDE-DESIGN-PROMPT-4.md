# Prompt for Claude Design — round four (three components)

> **Status, 2026-08-07 — do not re-send this file.** It was pasted into Claude Design while it
> still described only two components. `Image` and `AudioPlayer` shipped from it and are good;
> `CoachMark` was added to section 3 afterwards and never reached Claude Design. The outstanding
> work is in **`CLAUDE-DESIGN-PROMPT-5.md`**, which carries `CoachMark` plus two follow-ups.
> This file is kept as the record of what was asked for, not as something to run again.

Paste everything below the line into the same **HelioGrid Design System** chat.

---

The `Input` cleanup and the QR capacity raise both landed correctly — `onCommit` is unambiguously a
string now, the no-op guard compares normalised values, and 213 bytes covers a real tokenised link.

A final audit of all 152 screen briefs against the inventory turned up three components the product
needs that the system still doesn't have. In all three the state machine or the behaviour is the
requirement — the visual is yours.

## 1. `Image` / `Thumbnail`

There is no image component of any kind. `Avatar` is a person and `QRCode` is a code, so every
photograph in the product is currently a bare `<img>` with no states.

`MS9-23` (P0), verbatim, and it is the whole reason this needs to be a component:

> *"Image loading has THREE distinct states — loading, present, permanently missing — with a
> stable footprint so print pagination never shifts."*

**"Permanently missing" is a distinct third state, not an error.** A photo that will never arrive
must say so and keep occupying the same space. And the footprint must be reserved *before* the
image loads — this is the only component in the system where a layout shift is a correctness bug
rather than a polish issue, because the proposal document paginates for print and a late-arriving
image repaginates the customer's PDF.

Where it's used, so you can see the range:

| Surface | Brief | What it carries |
|---|---|---|
| Proposal document | `SCR-M06-17` | *"tenant logo, cover image"* — the print-pagination case |
| Customer proposal link | `SCR-F5-01` | same three states, named as `image-loading / image-present / image-missing` |
| Design cards | `SCR-MS-01` | *"satellite thumbnail of the confirmed pin"* |
| Studio roof step | `SCR-MS-05` | *"The survey's photographs ride alongside the canvas as the designer's reference — and are never measured from"* |
| Studio capture review | `SCR-MS-10` | *"cover image preview (or 'no cover captured yet')"*, and a shadow set of four that each render an image **or** the literal words *"Not captured"* |

Two things the briefs imply that are worth building in rather than leaving to 152 sessions:

- **A caption/attribution slot.** `MS9-24` (P0) requires accessible names on elements with real
  roles, and the shadow set captions each shot with a name and a date/hour.
- **A "reference only, never measured from" affordance.** `M05-29` (P0) is explicit that survey
  photographs are reference and are never measured from. If the component has a documented way to
  mark an image as reference-only, that law is expressible; otherwise every studio screen invents
  its own note.

Note also that `SCR-MS-13`'s `MS11-11` (P0) says imagery *"reports shortfall before staleness"* —
so a stale image and a missing image are different facts. The `Banner` you built already carries
staleness; the image component needs to not fight it.

## 2. `AudioPlayer`

Call recordings must be playable, and the states are governed by consent and retention law rather
than by playback mechanics. From `SCR-M07-13` (call record detail), the brief's own state list:

- **`recording-available`** — *"recording playable where consented and within the pack's retention bound"*
- **`recording-consent-declined`** — *"the recording-consent flag shows the customer declined; no
  recording exists but the call proceeded and the transcript survives"*
- **`recording-purged-retention`** — *"recording purged at the pack's retention bound; the
  transcript is retained"*

`SCR-M07-19` (call log) repeats the same pair as `recording-within-retention` / `recording-purged`.

The design point: **the two "no audio" states are not the same state and must never look the
same.** "The customer declined to be recorded" and "the recording existed and was deleted on
schedule" are different facts about the business, and a field user or an auditor reading the screen
has to be able to tell them apart. Neither is an error, and in both cases the transcript survives —
so the component should be able to say what happened and point at what remains, rather than showing
a disabled play button.

Beyond that it's an ordinary player: play/pause, scrub, elapsed/total, speed, 44×44 targets,
keyboard operable. The data volume is a full sales call, so the scrubber has to work at that length
on a phone.

## 3. `CoachMark`

First-run guidance is required on two screens, and `Tooltip` is not the right object for it: a
tooltip is ephemeral and, by N1, can never be the only carrier of meaning — a touch user simply
never sees it. A coach mark is the opposite: persistent, anchored to a live control, and dismissed
deliberately.

`M01-16` (P1), verbatim:

> *"First-run coach marks: maximum three, on the screen they actually landed on, dismissible.
> Never a carousel."*

`MS1-08` (P1), on the studio's first step:

> *"First-run interactive walkthrough replaces the POC's decorative tutorial banner: coach marks
> over the live screen (search → confirm → next), shown once, dismissable forever, reachable from
> Help."*

Read together, those two rows fix the whole design:

- **Never a carousel, and never a modal tour.** The marks sit *over the live screen*, anchored to
  the real controls, and the screen underneath stays usable. A sequence of full-screen slides is
  explicitly what this replaces.
- **Maximum three**, and on the screen the user actually landed on — not a generic welcome tour
  played on entry regardless of where they are.
- **Shown once, dismissable forever** — so it needs a per-mark dismiss and a "don't show this
  again" that genuinely sticks, not just a close button.
- **Reachable from Help afterwards.** Once dismissed it must be replayable on demand, which means
  the component can't be purely first-run-triggered.
- The studio's sequence is ordered (*search → confirm → next*), so a step counter and a next
  affordance are wanted — but a single standalone mark must work too, since `M01-16` allows one.

Both requirements are **P1**, so this is the least urgent of the three — build it last if you'd
rather get `Image` and `AudioPlayer` out first.

## Conventions

Same as before — `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` with real Indian solar content,
and a group card with the `@dsCard` marker. Suggested placement: `Image` and `AudioPlayer` in
`components/data/` alongside `QRCode`, `CoachMark` in `components/feedback/` next to `Tooltip` —
move them if a different grouping reads better to you.

All three still owe the four laws: all their states, honesty (a missing image and a purged
recording each say which they are), provenance where numbers appear, and own-width rather than
viewport. `CoachMark` in particular must be keyboard-dismissible and must not trap the user.

Please also add one line to `readme.md`'s index for each, and update the "V2 composite layer"
section's component list.

That's the last of it — after this the system covers all 152 screens.
