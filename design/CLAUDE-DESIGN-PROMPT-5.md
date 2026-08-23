> ## ⛔ ALREADY SENT — DO NOT RE-SEND
>
> This prompt was sent to the HelioGrid Design System (`c8aa4326-21bf-453a-8d11-749cc81dee12`)
> and **every change in it landed**, verified against the live project on 2026-08-16. It is kept
> as the record of what was asked and why, not as an instruction.
>
> Re-pasting it would ask Claude Design to rebuild components that already exist, and it reasons
> from an inventory that has since changed. If you need a change to the design system, write a
> new numbered prompt.

# Prompt for Claude Design — round five (the delta after round four)

Paste everything below the line into the same **HelioGrid Design System** chat.

*Context for me, not for the paste: round four was sent as a two-component prompt. `Image` and
`AudioPlayer` shipped and are good. `CoachMark` was added to the prompt file afterwards and never
reached Claude Design — that is the whole of what's new below, plus two small follow-ups.*

---

`Image` and `AudioPlayer` both came out right, and two calls in there were better than what I asked
for: splitting missing into **`not-captured`** (nobody took it — permanent, neutral) versus
**`unavailable`** (the fetch failed — retryable) is exactly the distinction `SCR-MS-10` needs for
its *"Not captured"* shadow slots, and suppressing `staleAt` while the image is missing is a
correct reading of `MS11-11`'s *"shortfall before staleness"*. Catching that `Image` shadows the
browser's native `Image` constructor, and documenting the alias, was a good save.

One component from that round never reached you, plus two small things.

## 1. `CoachMark` — the component that got left out

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

Read together those two rows fix the whole design:

- **Never a carousel, and never a modal tour.** The marks sit *over the live screen*, anchored to
  the real controls, and the screen underneath stays usable. A sequence of full-screen slides is
  explicitly the thing this replaces.
- **Maximum three**, on the screen the user actually landed on — not a generic welcome tour played
  on entry regardless of where they are.
- **Shown once, dismissable forever** — so it needs a per-mark dismiss *and* a "don't show again"
  that genuinely sticks, not just a close button.
- **Reachable from Help afterwards.** Once dismissed it must be replayable on demand, so the
  component can't be purely first-run-triggered.
- The studio's sequence is ordered (*search → confirm → next*), so a step counter and a next
  affordance are wanted — but a single standalone mark must work too, since `M01-16` allows one.

It must be keyboard-dismissible and must **not** trap focus — this is guidance layered over a
working screen, not a dialog. Both requirements are P1, so it's the least urgent thing in the
system; it's just the last gap.

## 2. Give `Image` a collision-free alias

You documented that `Image` shadows `window.Image` and that consumers must alias it on
destructure. That works, but it relies on every future consumer reading the `.d.ts` first, and the
failure mode is silent and global — `new Image()` breaking for unrelated scripts on the page is a
horrible bug to track down.

Please **also** export the same component under a non-colliding name, so the safe path is the
default one and the alias note becomes a convenience rather than a requirement. Keep `Image`
exported as well so nothing already written breaks.

## 3. Confirm the index actually lists them

Round four asked for a `readme.md` index line per component and an update to the "V2 composite
layer" section. Please check that `Image`, `Thumbnail` and `AudioPlayer` are all listed there, and
add `CoachMark` alongside them — the index is what the next person reads to find out what exists,
and a component missing from it effectively doesn't.

## Conventions

Same as always — `CoachMark.jsx`, `CoachMark.d.ts`, `CoachMark.prompt.md` with real Indian solar
content, and its card carrying the `@dsCard` marker on the first line. `components/feedback/`
next to `Tooltip` is the natural home. All four states where they apply, honesty, 44×44, focus
rings intact, own-width rather than viewport.

After this the system covers all 152 screens and I'm done sending you prompts.
