# Component gaps — `@heliogrid/ui`

**A register, not tasks.** No requirement rows sit behind these, so they carry no `T-` id and are
exempt from `docs/tasks/README.md`'s task anatomy. Each was found by drawing a real screen against
the component and hitting the wall.

**Fix when you touch the component, then delete the row.** Fix **both halves** — this repo *and* the
design system screens are drawn against — or the two silently drift.

| Component | Gap | Found by |
|---|---|---|
| `OtpInput` · `Input` | Helper is fixed `--text-tertiary` 12px, which `N4` forbids for anything load-bearing — so every screen with a load-bearing sentence beside a field draws its own `--text-secondary` line outside the component and the spacing becomes a per-screen decision. | `SCR-M01-08` · `SCR-M01-09` |
| `NumberField` | No unset value. `value` defaults to `0`, so an unanswered field shows a figure nobody declared, and no tier can qualify it (`N7`). | `SCR-M01-04` |
| `NumberField` · `OptionCardGroup` | Field `error` is described, not announced. The `Text` primitive now carries `live` (`PhoneField` uses it); these two still need it wired to their own error props. | `SCR-M01-04` |
| `Provenance` | Its line is fixed `--text-tertiary` — wrong where the tier IS the screen's honesty contract. Wants an `emphasis` prop. | `SCR-M01-04` |
| `Modal` | No `labelId`. Its fixed icon header forces the caller to drop `title`, which drops the `aria-labelledby` with it. `Sheet` has one. | `SCR-M01-01` |
| `Banner` | No `kind` for a signed-out steer — `suggestion`'s spark reads as AI. One action pill where two full-size routes are wanted. | `SCR-M01-02` |
| `Input` | No loading form. `StatCard`, `DataTable`, `Timeline`, `Sheet` and `DetailPanel` all take `state="loading"`; `Input` takes none and no `Shimmer` is exported, so each screen hand-draws a differently-shaped waiting field. | `SCR-M01-09` |
| `Avatar` | No nameless state. Its fallback derives initials from `name`, so an empty name renders an empty tinted circle — a rendering fault, not "no name yet". | `SCR-M01-09` |
| `Input` | Its label is weight 500, which the type rule permits for buttons, tabs and table headers only. | `SCR-M01-09` |
| `Input` | No provenance slot. It has `attribution` (which layer supplied a value) and nothing for how far to trust it. `NumberField` has one. | `SCR-M01-05` |
| `DetailPanel` | **No `bodyStyle` slot, and the workaround is three mechanisms.** Pinning a block flush to the panel's bottom needs a wrapper that takes the container's bottom padding as its own and hands it back as negative margin PLUS `bottom: calc(-1 * var(--sp-6))` — because the sticky constraint rectangle is the scrollport's CONTENT box, not its padding box. A negative margin alone only moves the flow position; a negative sticky offset alone gets clamped. None of it is discoverable from the component's surface. | `SCR-M01-13` |
| `Provenance` | **A tier word cannot be localised.** The source clause is the caller's and translates; the tier WORD comes from the component's own registry, so a Marathi interface reads *Derived*. An honesty line the reader cannot read is not one — the registry needs the market pack's language. | `SCR-M01-12` |
| `Avatar` · `PhotoField` | **Initials are computed from the name, and Devanagari has no initials.** The first character of two words in `प्रिया देशमुख` is two conjunct clusters reading as a syllable, not a monogram. Wants a caller-supplied monogram or a per-script rule. | `SCR-M01-12` |
| `DataTable` | Its loading state **drops the header row**. `Person · Roles · Status · Last active` are words the app knows before any record arrives, and the one thing a table can say that a card cannot. `TableSkeleton` takes only `stacked`, so it cannot draw them. | `SCR-M01-12` |
| `Chip` | Its resting ground is `--surface` at `--e1` — it reads on the canvas and **disappears inside a white `RecordCard`**, the exact host `ChipGroup` was built for. `Badge` is the right instrument for a label a record HAS; the docs name `Chip` first. | `SCR-M01-12` |
| `RecordCard` | `meta` is mono + tabular-nums, and one legitimate entry on it is not a number — `NamedGap` sets its own face there, which works and is undocumented. | `SCR-M01-12` |
| — | **Nothing says "you will not see this".** `ScopeNote` covers an act somebody else holds and `ComplianceFloor` an act nobody holds; a VISIBILITY limit — *your list is yours, the pipeline is the owner's view* — has no component, and `UnavailableNote` speaks only for the surface it is on. Hand-drawn, which is how two screens explain one scope two ways. | `SCR-M01-10` |
| — | **No capability row.** An icon plus a wrapping phrase, repeated — wanted by every role, plan and permission surface. `ListRow` cannot hold it: nowrap title with an ellipsis, 64px per row, built to be pressed. | `SCR-M01-10` |
| `ScopeNote` | Documented as belonging to an action row, but its sentence is exactly right for a card that DESCRIBES permissions. Either the doctrine widens or an explainer variant exists. | `SCR-M01-10` |
| `AppRail` · `BottomNav` | Inactive destination labels are `--text-tertiary`, and the 1536 rail carries its words only in `aria-label`. A destination label is load-bearing (`N4`), and `F7-31` parity makes "visible at 375, invisible at 1536" a question. The redundant `title` tooltips are removed; the tertiary and the missing visible word are a design call. | `SCR-M01-10` |
| 5 elements | **`title` carries meaning nothing else does** — `AllocationMeter` span, `Breadcrumb`'s collapsed crumbs, `BarChart`'s bar value, `Stepper`'s dot name, `UsageMeter`'s threshold. A tooltip is hover-only (`N1`) and is not reliably announced either. Each needs a visible or named replacement. | sweep 2026-08-31 |
| 10 classes | **`--text-tertiary` on the thing itself, not on a caption beside it** — `BandedFigure.label`, `Derivation.part-label`, `DocumentPreview.slot-label`, `FilterBar.sort-pills-label`, `JobTray.panel-label`, `OperationProgress.stage`, `PagedDocument.annotation-label`, `Stepper.rail-heading`, `Timeline.label`. Found by sweeping all 95; each needs a design call on whether it is quiet furniture or information (`N4`). | sweep 2026-08-31 |
| — | No `Skeleton` component, and no duration token for the stated 1.4 s shimmer (nearest is `--dur-ambient`, 500 ms). | `SCR-M01-03` |
| — | No selectable, keyboard-operable list row. `ListRow`'s `onClick` sits on a plain container: no `role`, no focus stop, no `selected`. | `SCR-M01-05` |

**Has an owner, so not listed above:** `F3-13`'s React Native half — components read
`theme.type.families.sans` and RN has no per-codepoint fallback, so Devanagari falls to the OS face.
`T-FPLAT-007` owns it with `F3-17`'s per-script line height. The web half is fixed.
