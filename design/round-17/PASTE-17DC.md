The verification I told you to `grep` lives in my repository, not in this project — you had no way
to read it, and that was my mistake, not a gap in what you did. Here is the content instead.

These are the remainders from a pass that re-read every one of the 48 components rounds 13–16 sent,
quoted in the words of the reader who found each. **Corrections, not new capability** — a
`.prompt.md` still showing a pre-fix example, a `.d.ts` describing behaviour the `.jsx` no longer
has, a card teaching the old form.

**Already handled — skip anything touching these:** the functional defects from two sessions ago
(the `--warning` mark, `CompareGrid`'s 375px arithmetic, `PreviewFrame`'s crop, `MapSurface`'s
z-index, `ReorderList`'s announcement, `Derivation.mode`, `aria-busy`, `MarketFormat`,
`AllocationMeter`'s epsilon, `@page`), all eleven law conflicts, and gaps 15 and 38.

**Several of these are certainly stale by now** — your last three sessions fixed things nobody had
reported. Where a remainder describes something already done, **say so rather than redoing it**.
That is more useful to me than a silent second edit.

Where an entry ends with **[…truncated]**, the finding was longer than I could paste. The pattern is
stated in what you have; sweep that component's own `.jsx`, `.d.ts`, `.prompt.md` and card for the
rest of it rather than fixing only the instance named.

**Don't ask me how it should look.** Every one is a statement of fact about the system; the fix is
to make it true.


*Part 3 of 3 — gaps 41, 43, 44, 46, 47, 50, 51, 52, 53, 54.*

## Gap 41 · `error` added to NumberField, SegmentedControl · **functional, not documentation**

But two defects in the new state itself, both quotable from source, stop this at PARTIAL.
(1) AN ERRORED NumberField OR TimeField CAN NEVER SHOW A FOCUS RING — on the exact screen this gap exists for. components/forms/NumberField.jsx:
  `boxShadow: refused || error ? "inset 0 0 0 1.5px var(--danger), var(--e1)" : focus ? "0 0 0 2px var(--accent)" : "var(--e1)",`
`error` precedes `focus`, and by the file's own rule "`error` is a PROP the component never sets or clears", so unlike a refusal — which `onFocus` clears, releasing the ring — this state is permanent. A focused errored field renders pixel-identical to an unfocused one. TimeField.jsx is the same (`refused || error || invalid ? … : focus ? …`), and TimeRangeField passes `invalid={!!error}` to BOTH boxes, so an errored calling window loses the focus ring on both. components/forms/Input.jsx orders it the other way and does not have the problem: `boxShadow: disabled ? "none" : focus ? "var(--e2), 0 0 0 2px var(--surface), 0 0 0 4px var(--accent)" : ringColor ? \`inset 0 0 0 1.5px ${ringColor}, var(--e1)\` : "var(--e1)"`. M06-22's jump "opens the exact step, with the failing fields highlighted" — a keyboard user landing on a step with three errored NumberFields cannot see which one has the caret. (Select.jsx and Textarea.jsx share NumberField's ordering, so the system is split 3–1 on this; gap 41 propagated the losing half into two more components and, because errors never self-clear, made it permanent rather than momentary.)
(2) TimeRangeField's ONE SENTENCE IS DESCRIBED TO NOBODY. `<TimeField … invalid={!!error} …/>` sets `aria-invalid` on both inputs, but inside TimeField `aria-describedby={error && !refused ? `${fieldId}-err` : undefined}` — `error` is undefined there, only `invalid` was passed — and the pair's paragraph carries no id: `: error ? <p style={{ margin: 0, fontSize: 12, … }}>{error}</p>`. So both boxes announce "invalid" with no reason attached, contradicting readme law 17's stated mechanism, "described rather than announced".
Two smaller inconsistencies worth carrying forward: OptionCardGroup's `label` is `aria-label={label}` only and renders no visible text, while SegmentedControl's new `label` renders a visible line on the reasoning "a highlighted field with no name is a highlight of nothing" — the same reasoning, applied to one group control and not its twin; and SegmentedControl puts `aria-invalid` on `role={wrapped ? "group" : undefined}`, a role that does not support aria-invalid, where OptionCardGroup correctly uses `role="radiogroup"`.

**[…truncated]**

## Gap 43 · OperationProgress · **functional, not documentation**

the defect verbatim. components/feedback/feedback.card.html is live in the pane (_ds_manifest.json: {"path":"components/feedback/feedback.card.html","group":"Components","subtitle":"Empty state, progress, banner, toasts","name":"Feedback"}). Its header is `<!-- @dsCard group="Components" viewport="700x450" name="Feedback" subtitle="Empty state, progress, banner, toasts" -->`, it imports `const { EmptyState, ProgressBar, Banner, Toast, Button } = window.HelioGridDesignSystem_c8aa43;` — OperationProgress is not imported at all — and it renders:
  `<span style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--text-tertiary)"}}>Generating design</span>`
  `<ProgressBar value={40} gradient />`
"Generating design" is a long-running studio computation reduced to a bare 6px gradient rail, with an 11px hand-rolled overline standing in for the label the component does not have — no stage, no n-of-m, no indeterminate distinction, no cancel, no destination. That is word-for-word the register's evidence ("Its own doc names long-running AI operations as its use and gives them no label… no stage, no cancel and no destination") and word-for-word what ProgressBar.prompt.md now disclaims: "A long-running operation reduced to a bare rail (which this component's own docstring used to invite) is the defect `OperationProgress` was raised about." The retraction landed in ProgressBar's own docs and was not carried to the sibling card that renders ProgressBar live. The same card also does `<span…>Capacity used</span><ProgressBar value={72} />`, breaking readme's UsageMeter law ("the billing meter… separate from `ProgressBar` on purpose").
FINDING 2 — the shell's own teaching surfaces never teach the `jobs` slot. components/navigation/app-shell.card.html (live card) renders both bars with no `jobs`: `<AppHeader title="Leads" … tenant={…} search={…} notifications={7} onNotificationsClick={()=>{}} actions={<Button size="sm">Add lead</Button>} avatar={…}/>` and `<MobileTopBar brand={…} tenant={…} title="Leads" onSearchClick={()=>{}} notifications={7} …/>`; its subtitle enumerates the slots as "brand, one global search box, and a bell whose badge counts". AppShell.prompt.md says "**Three P0 rows decide the slots:**" and lists only MS12-19, F6-20, F6-17 — M02-21 is absent, and all four of its shell examples omit `jobs`. Both contradict readme.md line 138: "**The shell also carries the `jobs` slot** — a `JobTray`, before the bell".

**[…truncated]**

## Gap 44 · Checklist in components/data/ · **functional, not documentation**

but it is the enforcement surface). guidelines/touch-targets.card.html is the system's own sweep — "it opens **every specimen card in the system** in an iframe ... measures the rendered rectangle" — and its `CARDS` and `PHONE` arrays do not contain `components/data/checklist.card.html`. The most phone-bound component in the system (SCR-MS-17, 375px, one-handed, on a roof) is absent from the phone pass, so its 44px claims have never been measured by the instrument that exists to measure them.
Not found, having looked: no .d.ts/.jsx disagreement, no contradicting neighbour (FindingList and ComplianceFloor do not overlap; Timeline/Checkbox/ProgressBar are correctly named as rejected), no stale template (the three templates do not render a checklist), and MS11-28/29 are marked "non-UI half, build-side — for awareness, not for drawing" so their absence is legitimate.

## Gap 46 · components/data/MoneySummary.jsx + .d.ts, DataTable.totalRow in <tfoot · **functional, not documentation**

the one figure that teaches the zero-never-negative rule contradicts the component rendering two inches away.
(2) A DEAD PROP. The same panel has `<NumberField label="Monsoon offer" currency … helper="Push it past the cost and watch the payable floor at zero." min={0} max={2000000} />`. `NumberField.jsx` destructures `label, unit, hint, disabled…` — there is no `helper`, and `.d.ts` lists `hint?: string`. The one instruction telling a reader how to exercise the floor renders nowhere.
(3) THE CARD'S LIVE EXAMPLE PERFORMS THE BEHAVIOUR ITS PROSE FORBIDS. That NumberField omits `outOfRange`, which `NumberField.jsx` defaults to `"clamp"`; with `min={0} max={2000000}` a typed 30,00,000 hits `note = correctionMessage || \`Capped at the ${mkt.money(max)} maximum.\`` and commits ₹20,00,000. The note directly below says "The *entry* side is `NumberField outOfRange="refuse"`", and money-lines.js's header, `MoneySummary.d.ts`, readme law 16 and SKILL.md all name clamping as the wrong answer for money. A screen author copying gap 46's spec card gets a clamping money field.
Neighbour check, not a blocker but unreconciled: `DocumentPreview` — named in gap 46's own "Where" line as "`lineItems`+`total`" — still ships an itemised money band whose total is asserted, not computed, and carries `subsidy = subsidyNote ?? \`Less PM Surya Ghar subsidy ${mkt.money(78000)} · payable ${mkt.money(374471)}\`` — ₹3,74,471 is a literal that never recomputes, so `total={600000}` prints a payable of ₹3,74,471. Its `.prompt.md` still teaches `total={452471}`. SKILL.md walls it off ("never `DocumentPreview`, which is a branded quotation *specimen*") and none of gap 46's six screens use it, so law 16's "both read one arithmetic module" is not actually violated on the bound screens — but it is a third, unaudited treatment of "lines that sum to a stated figure".
Verdict PARTIAL: the capability and its API are real and its prose laws are right, so screens can draw the block correctly; but the spec card that is meant to prove it carries a wrong figure, a prop the component ignores, and a live control demonstrating the refuted behaviour.

## Gap 47 · StatCard.deltaDir

the defect gap 47 names, both doc-only:
(1) **`deltaDir = "up"` is an undocumented default.** .d.ts, .prompt.md and readme all state the `neutral` default for sentiment; none states that direction defaults to `up`. `provenance.card.html` exercises it twice — `<StatCard label="Pipeline value" value={452471} money delta="12%" provenance={{tier:"derived",source:"42 open quotes"}}/>` — so that card renders an up arrow and an sr-only "Up" the caller never asserted, on the very surface SKILL.md's "It defaults to `neutral`, **so state it**" is aimed at. That is direction inference, not the good/bad inference the gap forbids.
(2) `BandedFigure.jsx`'s header comment calls word+mark+tint "the same three channels StatusChip, Provenance and **StatCard's sentiment** use" — sentiment has two channels (tint + word); the arrow is deliberately direction-only. `BandedFigure.prompt.md` states it correctly, so the slip is confined to a source comment.
The capability the gap required exists with the API it required, and every teaching surface I could name agrees. CLOSED stands.

## Gap 50 · Dropzone `heldCount` + `onRetry` · **functional, not documentation**

But the .d.ts and the .jsx disagree on the gap's own required capability. Dropzone.d.ts: "`heldMessage` — /** Overrides the generated held-queue sentence. **The count and the retry stay.** */". The .jsx makes that false for the count. `held` is rendered in exactly one place — inside the sentence `heldMessage ||` short-circuits away: `const held = heldCount != null ? heldCount : files.length;` then `{heldMessage || (held > 0 ? `${held} ${held === 1 ? "photo" : "photos"} saved on this phone…` : "Saved on this phone…")}`. The held block's only other child is the retry `<button>`, a sibling. So passing `heldMessage` deletes the waiting count entirely while the docstring promises it stays — the retry does stay, which is exactly why the half-true sentence is dangerous.
This is not hypothetical on this gap's own screens, which are TWO: `SCR-M11-03` **and `SCR-M08-03`** — and the claim only ever argues M11-03. SCR-M08-03 is the Document Checklist ("document and photo capture happens in the field, often with no signal (a basement, a rooftop)… Capture must never lose work"), and the generated sentence hardcodes the noun: "photo"/"photos". A checklist row holding a PDF (Dropzone documents `accept="application/pdf"`) reads "3 photos saved on this phone." The author's only fix is `heldMessage` — the one path that silently drops the count M11-37 (P0) requires. The count landed for the photo case and is unreachable with correct wording on the gap's second screen.
Second, smaller: the retry is the system's third and the only one that cannot report failure. NoConnection.d.ts gives the same-named props a richer contract (`onRetry?: () => void | boolean | Promise<any>` where "Return `false` or reject to say it failed and the screen will say so", plus `failedMessage`, `timeoutMessage`, `retryTimeout`), and readme.md states it as the law: "its retry reports what actually happened instead of spinning". Dropzone's is `onRetry?: () => void` with `disabled={busy}` and a label swap only, so a flush that fails on a roof with no signal returns silently. Relatedly, `busy = state === "uploading"` is the same flag that drives `{busy ? "Uploading…" : label}` and `{busy ? <Spinner/> : <CameraGlyph/>}`, so pressing retry replaces "Add payment proof" with "Uploading…" — the shape readme.md names as a defect ("`Button loading` … **replaces the label with a spinner**, deleting the name of the act being awaited").

**[…truncated]**

## Gap 51 · Kanban phone form = one column + a FilterChips stage strip, with `stac

but it teaches nothing about the old form).
RESIDUAL DEFECTS, none of which withhold the capability:
1. The stage strip is an UNNAMED TABLIST. FilterBar.jsx renders `<div role="tablist" aria-orientation="horizontal" ...>` with no aria-label, FilterChipsProps has no `label`, and Kanban's `stageFilterLabel` is a bare `<span>` with no id and no aria-labelledby. Its sibling one row down does have the affordance — `FacetChips({... label ...})` → `<div role="group" aria-label={label}>`. Kanban.jsx's own comment reasons about exactly this and gets it backwards: "A visually-hidden one would leave the tablist unnamed for a sighted reader" — the choice made leaves it unnamed for a screen reader, on the one form where the comment says "the filter IS the navigation", and `aria-labelledby` on the visible span would have given both.
2. Recomputed from tokens/colors.css with the system's own WCAG maths: `--text-tertiary` #6B6E74 on `--canvas-sunken` #EEF0F3 is 4.48, under the system's own `TEXT_FLOOR = 4.5` (color-contrast.js). Kanban sets words in that pair — the column count and the "Nothing here" empty label sit on `background: "var(--canvas-sunken)"`. Pre-existing, and colors.css only ever certified tertiary "on BOTH #FFFFFF and #F6F7F9", but the phone form is now the primary reading of that column.
3. Law 4's new general clause "**And a component that owns a breakpoint has to publish it.**" is contradicted by law 4's own opening sentence: it names `DataTable` (640) and `SheetActions` (320) as breakpoint owners, and DataTable.d.ts has no onFormChange — it leaks `{stacked}` only into `rowActions(row, {stacked})`. Kanban obeys the law it introduced; its two named neighbours do not.
4. Kanban.d.ts's "Same shape as `EditorSurface`" is loose. EditorSurface.d.ts publishes through a hook with a caller-mounted probe returning `{ref, layerWidth, panel, probeStyle}`; Kanban fires a callback returning `{stacked, width}`. One idea, three vocabularies across Kanban/EditorSurface/DataTable.
5. COULD NOT VERIFY: _ds_bundle.js is 269KB and get_file caps at 256KiB; the compiled Kanban falls in the unreadable tail (grep finds "Kanban" only in the header manifest), so I cannot confirm the artifact the two spec cards actually execute matches the source. Its header records `"components/data/Kanban.jsx":"e4d94110c640"` with no recomputable algorithm.

**[…truncated]**

## Gap 52 · ChipGroup · **functional, not documentation**

the defect it fixes ("a pill 6px too narrow (`ChipGroup`'s \"+N\", **38.1**×44)"). I re-measured the pill: 24px padding + "+9" at 13px ≈ 38.3, so 38.1 was right and `minWidth: 44` closes it; the negative margin (expressive −8, functional −10) keeps the 28/24px line height, and `TD = { … height: D.rowH … }` makes rowH a genuine floor. `_ds_manifest.json` exports `ChipGroup` and `MarkRow` and registers `marks-and-chips.card.html`; SKILL.md and readme.md:108 state the same rule. But "TEACHING SURFACES AGREE" is false, and the cell half is not honoured at both sizes in the way its own docs promise.
1. `column.wrap` is silently a no-op on three of the four stacked-card slots — the twin-call-site failure, inside the very pair they cite. `components/data/DataTable.jsx:445` filters `const rest = columns.filter((c) => c !== primary && c !== secondary && c !== trailing && !c.hideStacked);` and ONLY the `rest` branch reads `wrap`: line 490 `<dd style={{ … gridColumn: c.wrap ? "1 / -1" : undefined … ...(isLive(c) || c.wrap ? TAPPABLE : null) }}>`. The other three slots read `isLive` alone — line 476 `...(isLive(primary) ? TAPPABLE : null)`, line 477 `...(isLive(trailing) ? TAPPABLE : null)`, line 479 `...(isLive(secondary) ? TAPPABLE : null)`. So a `wrap` column that is also `secondary` (documented as "Sits under the title when stacked" — the natural home for a roles/flags cell) gets neither the full-width label-above treatment nor `pointerEvents: "auto"`, and since the content wrapper is `pointerEvents: onRowClick ? "none" : undefined` (line 475), the "+N" becomes **untappable on the phone** on any clickable row. They correctly called the `TAPPABLE` on a wrap cell "load-bearing" — which is exactly why its absence on the other three is a defect, not a nit. `DataTable.d.ts` states the rule unconditionally ("the column takes the **full width** of the stacked card with its label above rather than beside it") and fences nothing; no specimen exercises the combination, because no teaching surface renders a stacked wrap cell with `onRowClick` at all (`marks-and-chips.card.html` passes no `onRowClick`; app-layout's Mobile() uses `RecordCard`, not `DataTable`).
2. The M01-34 empty case is taught three different ways, and two of them improvise past `NamedGap`. `templates/app-layout/app.jsx`: `empty={<NamedGap scale="cell" gap="No flags" />}`.

**[…truncated]**

## Gap 53 · LanguageSwitcher · **functional, not documentation**

the gap's two named screens — teaching a strip that states the opposite of its own data.
WHAT HOLDS (verified, not accepted). Switcher half: LanguageSwitcher.d.ts carries `export type LanguageContentState = "authored" | "inherited" | "empty";` on `AgentLanguage`, and LanguageSwitcher.jsx renders three non-colour channels per item plus `` `${cur.label} · ${curWritten} of ${total} ${sectionNoun} written here · ${total - curWritten} fall back to ${fallbackName}` ``. Per-section half: Textarea.jsx really renders it — `{attribution && <div style={{ margin: "6px 2px 0" }}>{renderAttribution(attribution, { fieldName: label })}</div>}` — above the helper/error row, and ValueSource.jsx's `renderAttribution` accepts a spec, a level string or a node. Teaching surfaces I checked BY NAME and which agree: LanguageSwitcher.prompt.md ("The per-section half is `ValueSource`, not `helper`"), Textarea.prompt.md, ValueSource.prompt.md ("Two hosts were added this round"), readme.md line 93 and law 8 line 196, SKILL.md ("never in `helper` text"), agent-content.card.html (registered in _ds_manifest.json, and enrolled in guidelines/touch-targets.card.html's sweep at BOTH 1280 and 390), and — the neighbour check that could have killed it and did not — Tabs.d.ts and SegmentedControl.d.ts both explicitly DEFER: "it belongs to `LanguageSwitcher`, not to a third prop here". No second treatment.
NUMBERS RECOMPUTED, NOT ACCEPTED. #FFFFFF on #5A4BFF: linear RGB 0.10225/0.070316/1.0, L=0.144228, ratio 1.05/0.194228 = 5.406 — the file's "5.41 on --accent" is right and clears 4.5:1 for the 13px/500 pill. #6B6E74: L=0.155450 → 5.111 on white, 4.767 on #F6F7F9 — matches "5.11 / 4.77". Hit box: `const TOUCH = 44; const PILL = 34;` with `minHeight: TOUCH, minWidth: TOUCH` is FilterBar's own `const TOUCH = 44; const PILL = { ..., chip: 34, ... }` pattern, so "FilterChips exactly" is literally true. The 11px overline is the readme's one sanctioned exception ("The type floor is 12px, and the overline role is its only exception — 11px means uppercase/700/0.12em and nothing else") and the code is exactly `fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase"`. Every asserted number checks out.
DEFECT 1 — the twin call site teaches the lie the component exists to prevent. reorder.card.html wires SCR-M07-05 with both halves, so the claim is right that the twin was not forgotten — but its data is fabricated.

**[…truncated]**

## Gap 54 · Calendar mode="set" + lockedDates/onBlocked, and DateSet holding origi · **functional, not documentation**

the one contrast number in the new code: the locked-cell bar is `--text-inverse` #FFFFFF on `--accent` #5A4BFF = 5.41:1, over the 3:1 non-text floor. That number is honest.
WHY IT IS NOT CLOSED — four defects, three of them in the canonical card, all measured.
1 · THE SET-EDITING TARGET IS 44×36 IN THE CARD THAT TEACHES THIS GAP. holiday-calendar.card.html declares `function Holidays({ density="functional" }){` and renders the main SCR-M07-06 pane as bare `<Holidays/>` — so density is functional. DatePicker.jsx: `const cell = density === "functional" ? 36 : 44;` and the day button is `style={{ height: cell, minWidth: 44, … }}`. Seven 1fr columns inside `minWidth: 320` with 6×2px gaps gives exactly 44.0 wide; height is 36. readme.md's 44px law (P0, `N2`/`F7-29`/`F7-32`) allows "exactly four shapes" and one exception — "a pointer-only affordance *inside a data row*" — and Calendar's grid is `<div role="grid">`, not a `<tr>`. This is the ONLY route by which a tenant ADDS a date (`addLabel = "Tap a date to add a holiday"`), so it is the gap's primary control. guidelines/touch-targets.card.html registers this exact card in BOTH sweeps — `["Holiday calendar", C("forms/holiday-calendar")]` in `CARDS` (1280) and in `PHONE` (390) — and its verdict line is `const inRow = !!el.closest("tr"); const verdict = … (w >= MIN - 0.6 && h >= MIN - 0.6) ? "pass" : inRow ? "exception" : "FAIL";`, with `markSqueezed` rescuing only 390-failures that passed at 1280. 36 < 43.4 at 1280, inRow false → FAIL. readme's exhaustive list of what that sweep found records `Calendar`'s day as **40.9×44** — a WIDTH failure at 44 height, i.e. no functional-density calendar had ever been in the sweep before this card put one there. The claim asserted "(44×44)" for `DeleteButton` only (that one is real: `width: 44, height: 44, flexShrink: 0`) and never measured the cell.
2 · THE CARD PINS THE MONTH AND LEAVES TWO DEAD 44×44 CONTROLS. The card passes `month="2026-11-01"` and no `onMonthChange`. DateSet forwards both verbatim (`month={month} onMonthChange={onMonthChange}`). Calendar: `const view = month ? new Date(parse(month)…) : innerMonth;` and `const setView = (d) => { if (onMonthChange) onMonthChange(iso(d)); else setInnerMonth(d); };` — with `month` set and no handler, both NavButtons write `innerMonth`, which `view` ignores. The prev/next month buttons are inert and the `aria-live="polite"` month header never changes, in a component whose own `listLabel` default is "Holidays this year".

**[…truncated]**


---

## Deliverables

Corrections only — no new components.

> **Search the whole project for each old form** and paste every file that still contains it. Fix
> them and search again until empty. Include the unused half of a file.

Tell me, per gap: what you corrected, and which were already right.
