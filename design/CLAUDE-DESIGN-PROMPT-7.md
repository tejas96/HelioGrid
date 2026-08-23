> ## ⛔ ALREADY SENT — DO NOT RE-SEND
>
> This prompt was sent to the HelioGrid Design System (`c8aa4326-21bf-453a-8d11-749cc81dee12`)
> and **every change in it landed**, verified against the live project on 2026-08-16. It is kept
> as the record of what was asked and why, not as an instruction.
>
> Re-pasting it would ask Claude Design to rebuild components that already exist, and it reasons
> from an inventory that has since changed. If you need a change to the design system, write a
> new numbered prompt.

# Prompt for Claude Design — round seven: the contrast fix missed `components/data/`

Paste everything below the line into the **HelioGrid Design System** chat (the design-system
project, not a screen session).

---

The token work is correct and I verified every ratio you reported — all nine land within 0.02 of
what you stated, and every text token now clears 4.5:1 on white, canvas and its own tint. Pushing
`--text-secondary` to `#54565B` and keeping `--text-tertiary` a real text colour at 5.11 was a
better answer than the one I proposed; the three-step hierarchy survives intact.

But the sweep didn't finish. I read all 54 component files. **`components/forms/` (17),
`components/feedback/` (7), `components/navigation/` (4) and `components/overlays/` (4) are
completely clean** — nothing to do there. Every remaining violation is in `components/data/`,
plus one in `components/charts/`. Eleven of them.

## Group 1 — words still painted in MARK tokens (N4)

You established the rule yourself in `tokens/colors.css`: *"The plain token is the MARK; `-text`
sets words."* These three didn't get updated to it. Measured:

| token | white | canvas | own tint |
|---|---|---|---|
| `--success` `#159A5B` | 3.62 | 3.37 | 3.28 |
| `--warning` `#E9A23B` | 2.17 | 2.02 | 1.99 |
| `--danger` `#E5484D` | 3.91 | 3.65 | 3.43 |
| `--info` `#3B82F6` | 3.68 | 3.43 | 3.26 |
| `--neutral` `#74787E` | 4.44 | 4.14 | 3.93 |

**1. `components/data/Chip.jsx` — `Badge`.** The tone map destructures the plain mark token into
`c`, then applies `color: c` to the span that renders `{children}` — real words. Five of the six
tones fail. Swap to the `-text` partners. **The `accent` entry is correct as-is** — `--accent` on
`--accent-subtle` measures 4.65:1 — so leave that one alone.

**2. `components/data/StatCard.jsx`** — the delta chip reads
`color: good ? "var(--success-text)" : "var(--danger)"`. The positive branch is already right; the
negative branch on the same line still uses the mark token, and it sets the delta numerals. Make it
`var(--danger-text)`.

**3. `components/data/NextAction.jsx`** — `tone="overdue"` paints the label and meta words in
`var(--danger)`. Use `--danger-text`. This one matters more than its size suggests: overdue is the
only red in a list of thirty rows, so it is the thing a rep is scanning for.

## Group 2 — hardcoded colours where a token belongs (N4)

**4. `components/data/Chip.jsx`** — the active chip's label colour is a literal hex. Use a token,
so the contrast floor stays enforceable from `tokens/colors.css` rather than drifting per component.

**5. `components/data/FilterBar.jsx`** — the per-chip count is `rgba(255,255,255,0.8)` on the
active chip's `--accent` fill. That composites to `#DEDBFF`, which is **4.04:1** against the chip —
under the floor. Plain white on `#5A4BFF` is **5.41:1** and passes, so dropping the alpha fixes it.

## Group 3 — text below the 12px floor (N3)

N3 allows exactly one exception, the overline role: **11px / 700 / uppercase / 0.12em**. None of
these five qualify.

**6. `components/data/Avatar.jsx`** — `SIZES = { 24: 11, … }`, so a size-24 avatar sets its
initials at 11px/500 with no letter-spacing. The `Math.round(size * 0.38)` fallback also drops
below 12 for any custom size under 32.

**7. `components/data/Avatar.jsx` — `AvatarGroup`.** The `+{extra}` overflow counter is
`fontSize: size * 0.36`, which is **11.52px at the component's own default `size = 32`** and 8.64px
at 24. That number tells the user how many people are hidden, so it has to be readable.

**8. `components/data/Image.jsx`** — the missing-state label ("Not captured" / "Image unavailable")
renders at 11px, sentence case, `-0.01em`. This is the honesty state — the words that exist
precisely so a missing photo isn't silent — so it should not be the smallest text on the surface.

**9. `components/data/Image.jsx`** — the `referenceOnly` badge is **10px at 0.08em**. It is
uppercase and 700, so it is clearly *reaching* for the overline role, but the role is 11px/0.12em.
Either make it a true overline or take it to 12px — right now it qualifies as neither.

**10. `components/data/AudioPlayer.jsx`** — the skip numerals ("10" / "30") inside the back and
forward buttons are 10px. Worth noting these are the **only** visual difference between the two
skip buttons, so they are load-bearing, not decorative.

**11. `components/charts/MapSurface.jsx`** — map attribution at 10px.
*This one is a real judgement call and I'd rather you made it than have me dictate it:* attribution
is legally required text that convention renders tiny, and bumping it to 12px is visually louder
than every map surface expects. But N3 has one exception and this isn't it. Decide deliberately,
and write the reasoning into the component's own docs either way, so nobody silently "fixes" it
later in the wrong direction.

## When you're done

Tell me the new values and sizes so I can verify, the same way I verified the tokens. And please
add the `MARK vs -text` rule to `readme.md`'s colour section as a stated law — the reason five
components missed it is that the rule currently lives only as a comment inside `tokens/colors.css`.
