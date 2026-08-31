# Component gaps — `@heliogrid/ui`

**A register, not tasks.** No requirement rows sit behind these, so they carry no `T-` id and are
exempt from `docs/tasks/README.md`'s task anatomy. Each was found by drawing a real screen against
the component and hitting the wall.

**Fix when you touch the component, then delete the row.** Fix **both halves** — this repo *and* the
design system screens are drawn against — or the two silently drift.

| Component | Gap | Found by |
|---|---|---|
| `OtpInput` | Helper is fixed `--text-tertiary` 12px — no way to raise a load-bearing one (channel, validity window, tries left). | `SCR-M01-08` |
| `NumberField` | No unset value. `value` defaults to `0`, so an unanswered field shows a figure nobody declared, and no tier can qualify it (`N7`). | `SCR-M01-04` |
| `NumberField` · `OptionCardGroup` | Field `error` is described, not announced. A refusal under the finger has to be heard. Wants `announce`. | `SCR-M01-04` |
| `Provenance` | Its line is fixed `--text-tertiary` — wrong where the tier IS the screen's honesty contract. Wants an `emphasis` prop. | `SCR-M01-04` |
| `Modal` | No `labelId`. Its fixed icon header forces the caller to drop `title`, which drops the `aria-labelledby` with it. `Sheet` has one. | `SCR-M01-01` |
| `Banner` | No `kind` for a signed-out steer — `suggestion`'s spark reads as AI. One action pill where two full-size routes are wanted. | `SCR-M01-02` |
| `Input` | No provenance slot. It has `attribution` (which layer supplied a value) and nothing for how far to trust it. `NumberField` has one. | `SCR-M01-05` |
| — | No `Skeleton` component, and no duration token for the stated 1.4 s shimmer (nearest is `--dur-ambient`, 500 ms). | `SCR-M01-03` |
| — | No phone-number **display** component — the read-only half of the missing phone input. Hand-assembled twice is two formats for one number. | `SCR-M01-08` |
| — | No selectable, keyboard-operable list row. `ListRow`'s `onClick` sits on a plain container: no `role`, no focus stop, no `selected`. | `SCR-M01-05` |

**Has an owner, so not listed above:** `F3-13`'s React Native half — components read
`theme.type.families.sans` and RN has no per-codepoint fallback, so Devanagari falls to the OS face.
`T-FPLAT-007` owns it with `F3-17`'s per-script line height. The web half is fixed.
