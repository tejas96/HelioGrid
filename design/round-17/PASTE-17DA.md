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


*Part 1 of 3 — gaps 3, 5, 6, 7, 9, 10, 12, 13, 14, 16, 17, 18.*

## Gap 3 · DataTableColumn.provenanceFor · **functional, not documentation**

THE BOARD FORM OF A RECORD HAS NO SLOT. Kanban.d.ts KanbanCardItem is still `{ id, title, meta?: string, value?: string, owner?: string }` with `/** Right-aligned mono value, e.g. ₹5,12,000. */` — no provenance, no standing, on any of the three. A Kanban card is a record carrying money, and SCR-M08-01 is in this gap's own screen list (Kanban.d.ts binds itself to it: "`M08-10` (P0) / `SCR-M08-01`'s `mobile-single-column-filter`"). Its own card proves it: data-composites.card.html renders `{id:1,title:"Joshi bungalow",meta:"Nashik · 5.4 kWp",value:"₹3,20,000"}` × 4 with no qualifier of any kind, and pending-and-progress.card.html does the same with `value:"₹21,00,000"`. The only route is `renderCard?: (item, column) => React.ReactNode` — i.e. inventing your own adjacency per screen, which is precisely the failure this gap exists to prevent and which StatCard's slot rule forbids.
SECOND, THE LAYOUT REFERENCE STILL DOES NOT EXERCISE IT. templates/app-layout/app.jsx — "THIS FILE IS THE LAYOUT REFERENCE… Copy the arrangement" — carries money on both halves with no tier and no standing: `{ key: "value", label: "Value", numeric: true, strong: true, trailing: true }` on the desktop table and `meta={[l.city, `${l.size} kWp`, l.value]}` on the RecordCard. It gained `origin` this round (gap 22) but not `provenance`. Whoever copies the reference build copies a money column with no F8-01 tier.
THIRD, A PRE-EXISTING INVERTED DOCSTRING SURVIVED THIS ROUND. Provenance.jsx: `/** True when a spec would render something — lets a host reserve space without guessing. */` sits directly above `Provenance.isEmpty = (p = {}) => !resolveTier(p.tier) && !p.standing && !p.source && !p.projection && !p.note;` — which returns true when NOTHING renders. The behaviour is right (renderProvenance uses it correctly as a bail-out) and the name is right; only the sentence is backwards. Flagged in the previous round, unchanged.

## Gap 5 · tokens/field-mode.css second token scope + FieldModeToggle + the three · **functional, not documentation**

But four things stop it being CLOSED.
(1) THE TWO CONSUMERS THE FIX ADDED CANNOT STAY IN SYNC — AND THE TEMPLATE ASSERTS A LAW THAT IS FALSE. FieldModeToggle.jsx's whole store is `export function useFieldMode() { const [on, setOn] = React.useState(read); React.useEffect(() => { apply(on); }, [on]); return [on, setOn]; }` — no module-level store, no subscriber list, no `storage` listener, no MutationObserver. Every caller gets an independent `useState` copy whose initializer runs once. Finding 5's fix added a SECOND consumer (the shell sun button) beside the settings row that SCR-M01-11 — the one screen this gap names — exists to carry, and FieldModeToggle.d.ts describes them coexisting: "the sun button in the top bar, which is the surveyor's one-tap route, **plus this row in settings**". Render both: tap the sun → the top bar's copy goes true and `apply()` writes `<html data-field-mode="on">`, while the settings `<Switch checked={on}>` still renders unchecked against a screen that is visibly in field mode; its next tap sets its own stale state true and re-applies "on", so the switch appears dead on first press. `FieldModeToggle.set = apply` — the documented "deep link, a QA harness" route — desyncs every mounted switch identically, because it only touches the DOM and localStorage. templates/mobile-field-app/app.jsx states the opposite as fact: "FieldModeToggle.useFieldMode() is the same state the settings row writes, **so the two can never disagree**." That is the canonical template teaching a guarantee the hook does not provide. guidelines/field-mode.card.html mounts exactly one `<FieldModeToggle/>`, so no specimen exposes it.
(2) THE GHOST-CONTROL SWEEP MISSED components/data/AudioPlayer.jsx — IN A FILE THIS SAME WORK EDITED. `RoundBtn` sets `boxShadow: primary ? (hover ? "var(--e3)" : "var(--e2)") : ghost ? "none" : "var(--e1)"`, and `skip()` renders `<RoundBtn ghost size={52} label={dir < 0 ? "Back 10 seconds" : "Forward 30 seconds"}>`. Transparent background, `var(--text-secondary)` foreground, inline `box-shadow: none` — verbatim the profile Button.jsx's new comment forbids: "it must not hardcode `none`, or an inline none beats field mode's rule and the lowest-contrast control in the system is the one control with no edge in sunlight." So both 52px transport buttons on every call recording keep zero edge in field mode.

**[…truncated]**

## Gap 6 · Calendar/DatePicker reading month names, weekday names, field order an · **functional, not documentation**

WHAT REFUTES CLOSED: the claim certified the Charts leg from Charts.jsx alone. Charts.jsx is indeed fixed (`const fmt = format || mkt.number;` in all four charts), but ALL THREE of its teaching surfaces still teach the baked-IN form — the exact failure mode this audit exists to catch.
1. components/charts/Charts.d.ts — the API declaration, and a .d.ts that contradicts its .jsx. The strings "pack", "market", "MarketProvider" and "useFormat" appear NOWHERE in the file. It declares `format?: (n: number) => string;` on BarChart/LineChart/DonutChart/FunnelChart with no statement that omitting it yields the market pack, still documents the shortcut as an unqualified product fact — "/** ₹ in Indian grouping — ₹4,52,471. */ export function inr(n: number): string;" — and teaches the headline as a pre-formatted rupee string: "/** Headline figure above the plot, e.g. \"₹1,24,00,000\". */ value?: React.ReactNode;".
2. components/charts/charts.card.html — the @dsCard canonical example, never opened by the claim. It re-establishes the shortcut (`const inr = Charts.inr;`) and then BOTH money charts override the pack: `<LineChart ... value="₹94,20,000" ... format={inr}` and `<DonutChart ... centerValue="₹1.24 Cr" size={148} format={inr}`. No MarketProvider appears anywhere on the card. Only FunnelChart demonstrates the pack default; every chart that renders money re-bakes IN_FORMAT.money.
3. components/charts/Charts.prompt.md — carries the correct law ("**Number formatting comes from the market pack**, not from this file — pass `format` only to override it") and then contradicts it in its ONLY money worked example: `centerValue="₹1.24 Cr" format={inr}`.
Also a law contradicting a law in readme.md. L68 declares "**Currency, grouping, dates and clock are market-pack data, not content rules** (`F1` / `F3-20`)" — the line the claim quoted — while L7, which the claim did not read, still states it as a content rule: "Content is Indian: ₹ in Indian format (₹4,52,471), Indian names/cities, kWp system sizes, GST, DISCOM utilities." That is the register's own cited residue ("readme.md fixes it as a system fundamental") surviving one line-set away from its fix.

**[…truncated]**

## Gap 7 · TenantHeader + TenantMark

One stale sentence, in the file the gap named as the blocking doc. BrandColorField.d.ts still carries on its `helper` prop:
  "/** Defaults to the F7-07 statement: documents only, the app is never restyled. */"
"documents only" is the pre-fix half-scope statement, and it now misdescribes its own default. BrandColorField.jsx's actual default is correct and names both surfaces:
  helper = "Used on the proposal PDF and the customer link page. The HelioGrid app itself is never restyled."
So the shipped user-facing string is right and only the .d.ts comment describing it is wrong — but the .d.ts is the surface an implementer reads for the API, and this is the same file whose "documents only" framing the original audit quoted as the law forbidding the fix. The .jsx's own header comment is already correct ("the brand colour rides the generated proposal and the customer link page"), which makes this the last line in the component still teaching the old scope.

## Gap 9 · CountBadge — a counting numeral on AppRail / BottomNav / ShellAction,  · **functional, not documentation**

FINDING 6 IS UNTOUCHED — the stated justification is still not delivered by the API, and the sentence making the claim is still in the file verbatim.
AppShell.d.ts's docblock still argues the dot had to go partly because it "**has nowhere for the `derived` tier `SCR-SHELL-03` assigns it**, and fails `F7-12` on the surface every other screen copies." But CountBadgeProps is still exactly "count / max / label / tone / style" — there is no `provenance`, no `tier`, and no slot of any kind for one. The numeral has nowhere for the tier either, so the reason given for the change is still not satisfied by the change.
This is load-bearing for this gap specifically, because F8-01 and N7 are two of its four binding PRD rows, and the audit's own evidence quotes SCR-SHELL-03's numbers-carrying-provenance list opening with "The unread badge count — derived from the records". It is also a live disagreement with readme.md law 3, which says without qualification "Every user-visible number carries a tier (`F8-01`), rendered as a persistent, legible word beside the number it qualifies" — and whose new slot rule enumerates eight hosts (StatCard/charts, NumberField, ListRow, AccordionItem, Block, DataTable cell, record row, RecordCard) of which CountBadge is not one. So the badge's numeral is a user-visible number with no declared host in the very rule that claims to cover every host.
Either answer would close it: give CountBadge a tier slot, or state on the component that a shell counter is an exception and why (as Block's footer exception is stated) and drop the tier clause from the justification. Today it asserts the obligation and provides nothing for it. Everything else in this gap is verified closed; a screen can be drawn against the badge as it stands.

## Gap 10 · BannerAction as a 44px target around a 32px pill with the 6px/side bor · **functional, not documentation**

but the readme law that carries gap 10 teaches an enforcement guarantee the code does not provide, and the claim's sixth-site sweep is not a valid method.
PRESENT (quoted from the live project c8aa4326-21bf-453a-8d11-749cc81dee12):
- Menu.jsx default trigger: `style={{ width: 44, height: 44, display: "grid", placeItems: "center", ... }}`; Menu.d.ts: `/** Custom trigger element. Defaults to a 44x44 overflow button. */`; Menu.prompt.md: "// The default trigger is already 44x44". Residue 1 of round 14A is genuinely closed.
- Banner.jsx BannerAction: `style={{ minHeight: 44, minWidth: 44, margin: "-6px 0", padding: "0 2px", ... }}` wrapping `<span style={{ ... height: 32, padding: "0 12px", borderRadius: "var(--r-pill)", boxShadow: "var(--e1)", ... }}>`. That is legal shape #2 of the four the readme lists (44 box + smaller pill + negative margin), and the hit box is 44 because minHeight sits on the border box. Banner.d.ts ("**44px target, 32px pill.**"), Banner.prompt.md ("the button is **44px tall** while the pill you see stays **32px**") and banner.card.html ("The action's target is 44, the pill you see is 32", and every worked example uses <BannerAction> rather than a hand-rolled pill) all agree. Residue 2 is closed.
- All four original sites re-read in the live .jsx: Kanban.jsx MoveControls `style={{ width: 44, height: 44, ... }}`; DataTable.jsx SelectionBar `style={{ width: 44, height: 44, marginLeft: -10, ... }}` and Pagination btn `style={{ width: 44, height: 44, ... }}`; Menu trigger 44x44; Banner dismiss `style={{ width: 44, height: 44, margin: "-12px -12px -12px 0", ... }}`.
- Neighbour teaching surfaces the claim did not open also agree: Kanban.d.ts ("always-visible 44px move buttons") and Kanban.prompt.md ("The always-visible 44px move buttons are the keyboard and touch route"); SKILL.md ("Every interactive element is >=44x44, measured on the hit box. Four legal shapes ... The single exception is a pointer-only affordance inside a `<table>` data row"). All three templates carry `const size = stacked ? 44 : 32;`, including mobile-field-app's unrendered Desktop().
MISSING:
1. readme.md's own enforcement law is false. Line 30: "How the floor is enforced, so this is the last sweep. `guidelines/touch-targets.card.html` measures it in the browser on every load: it opens **every component specimen card** and the three templates in iframes at 1280px and 390px". Line 87: "it re-measures **every interactive element in every card and template** on load". SKILL.md repeats it: "re-measures the whole system on load".

**[…truncated]**

## Gap 12 · Block.count / countMax / countLabel — a first-class summary count in i · **functional, not documentation**

NOT FULLY CLOSED. The capability is real and I could not break it: Block.d.ts declares `count?: number` / `countMax?: number` / `countLabel?: string` and re-scopes `badge` ("**A count goes in `count`, not here.**"); Block.jsx implements it with its own COUNT_PILL (`background:"var(--neutral-bg)", color:"var(--neutral-text)", fontSize:12, fontVariantNumeric:"tabular-nums"`), `const n = typeof count === "number" && count > 0 ? count : null;` and `const shownCount = n === null ? null : countMax != null && n > countMax ? `${countMax}+` : mkt.number(n,{maximumFractionDigits:0});`. Checks the claimant did not run, all of which pass: (a) _ds_bundle.js — the file every .card.html and template loads — carries the SAME count logic, not a stale Block, so the card demo is live rather than aspirational; (b) grouping is not gated on a provider: MarketProvider.jsx does `React.createContext(IN_FORMAT)` and format.js exports `IN_FORMAT = createFormat(IN_PACK)`, so `count={1240}` renders "1,240" with no MarketProvider anywhere; (c) the "not CountBadge" rationale holds in the .jsx, not only the .d.ts — AppShell.jsx: `tone = "danger"`, `const words = n === null ? `Unread ${label}` : `${n} unread ${label}`;`, `boxShadow:"0 0 0 2px var(--surface)"`; (d) recomputed contrast: --neutral-text #585B60 on --neutral-bg #F0F1F3 = 6.03:1 (base) and #3A3D42 on #F0F1F3 = 9.65:1 in field mode — both clear 4.5; 12px equals the `--fs-caption` floor readme L46 sets for counters; (e) no template teaches the old form — none of the three app.jsx files uses Block at all, in either half.
TWO THINGS BLOCK A FULL CLOSE.
1. DEFECT — the count is silently dropped unless `title` is set, and the file contradicts itself about it. Block.jsx computes `const head = overline || title || meta || action || badge || shownCount;` — treating a count as sufficient reason to draw the header — but the pill renders INSIDE the title branch: `{title && (<div …><h2 …>{title}</h2>{shownCount && (<span style={COUNT_PILL}>…)}{badge}</div>)}`. `title?: string` is optional in the .d.ts. So `<Block overline="AGENT CALLS" count={6} countLabel="calls" />` — an overline-only today-block, exactly the SCR-M07-01 / M13-10 shape the gap was written for — renders the overline, an otherwise-empty header row, and no numeral, with no warning. Reproduced byte-identically in the shipped bundle. `badge` has the same gate.
2. TEACHING SURFACE ASSERTS A CROSS-COMPONENT FACT THAT IS FALSE, AND THE SYSTEM NOW RENDERS ONE NUMERAL THREE WAYS.

**[…truncated]**

## Gap 13 · SurfaceState · **functional, not documentation**

But three things break the CLOSED verdict.
1. THE BUG — `error` and `unavailable` are unreachable on UsageMeter, the component the gap was written for. UsageMeter.jsx orders its guards:
  `const resolved = typeof value === "number" && Number.isFinite(value);`
  `if (state === "loading" || !resolved) { return (<section ... role="status" aria-label={`${label}..., not resolved yet`}> ... {loadingNote} ...) }`
  ...then `/* RULE 3 */ if (state === "error")` and `if (state === "unavailable")` BELOW it.
UsageMeter.d.ts declares `value?: number` — optional — and documents `errorMessage` as "`error`'s sentence. It never quotes a figure", `onRetry` as "Draws the retry under `error`", and `unavailable` as "this meter does not apply to this plan. No bar, no figure, no retry." In both states there is definitionally no value: the default errorMessage is "Couldn't read this period's usage. Nothing is shown until it resolves." So the documented, natural call — `<UsageMeter label="AI designs" state="error" onRetry={r} />` or `state="unavailable"` with no `value` — hits `!resolved` first and silently renders the LOADING shimmer, announcing "not resolved yet" via `role="status"`, with the retry button unreachable. This is exactly the hunt target "a capability reachable only via a prop the default does not set": `value` has no default, and only a dummy finite `value` (e.g. `value={0}`) reaches the error/unavailable branches. SCR-M12-04's ruled error state — "this screen may only ever show the enforced/billed numbers" — therefore cannot be drawn as documented. The claimant quoted both guards separately and never noticed the first swallows the other two.
2. UsageMeter never joined the shared vocabulary, while three teaching surfaces say it did. UsageMeter.d.ts does NOT import SurfaceState; it declares its own `export type UsageState = "ok" | "overage-accruing" | "tracked-seats-accruing" | "cap-reached-grace" | "creations-paused" | "loading" | "error" | "unavailable"` — no `ready`, no `empty` — and UsageMeter.jsx defaults `state = "ok"`. The claimant quoted the signature as `export function UsageMeter({ label, value, limit = null, unit, ... })`, eliding `state = "ok"`.

**[…truncated]**

## Gap 14 · EditorSurface · **functional, not documentation**

the gap was written to kill. It is in scope: the register's nineteen surfaces explicitly name "the cancel confirm, the waive dialog, the reversal confirm, the record-payment sheet, the typed denial sheet" — decisions, Modal's declared job. Modal.jsx has no `modal` prop, hard-codes `aria-modal="true"`, always renders `SheetBackdrop`, and is unreachable from EditorSurface (which renders only Sheet or DetailPanel). Sheet.prompt.md/.d.ts and DetailPanel.prompt.md/.d.ts each gained "An editor mounts `EditorSurface`, not this."; Modal gained nothing. Worse, Modal.prompt.md's second canonical example is "Form modal — assign a surveyor" with two <Input>s — the assign picker from the register's own list — mounted on Modal with instructions to hand-swap on mobile; panels.card.html renders the same Modal confirm as its spec card with no EditorSurface on it.
(2) A README LAW CONTRADICTS THE CHANGE. The claim "the two docstrings the audit quoted are gone" is true of the .d.ts files, but a third copy survives as system law at readme.md line 34: "`Sheet`/`Modal`/`DetailPanel` trap focus and restore it" — stated as universal keyboard parity, no modal={false} carve-out, against line 150's "no focus trap".
(3) A .d.ts/.jsx DISAGREEMENT INTRODUCED BY THIS CHANGE. "DetailPanel.jsx carries the identical four gates" is false — it carries three. There is no `document.body.style.overflow` anywhere in DetailPanel.jsx; the effect cleanup is only removeEventListener plus focus restore. Yet the new DetailPanel.d.ts says "`false` drops backdrop, focus trap and scroll lock together" and readme line 150 makes "the three are one decision" law. On the desktop half — what a studio inspector at >=720px actually gets — the law is two-thirds implemented, and a modal DetailPanel lets the page scroll behind it.
ALSO: DetailPanel.jsx's header and DetailPanel.prompt.md publish a 560px own-width rule ("Below 560px of its own width it fills the container") the file never measures — only `width: "min(" + width + "px, 100%)"` — a fourth breakpoint number in prose beside EditorSurface's real 720.

## Gap 16 · Stepper / StepList / resolveSteps — reachability flipped to a `free` d · **functional, not documentation**

the ONE template the claim skipped — `templates/desktop-web-app/app.jsx` — and it imports no Stepper, same as the other two. Geometry re-read and correct (StepRow `minHeight: 52`; numbered marker `width: 44, height: 44, margin: -8`; NavBtn `width: 44, height: 44`; indicator centre `minHeight: 44`). SKILL.md, a teaching surface the claim never opened, also agrees: "`Stepper` / `StepList` default to `reachability="free"`".
What refutes CLOSED is that the fix OVERSHOT into the one flow the PRD forbids it for, and three teaching surfaces now teach the overshoot.
readme.md law 17: "`reachability="free"` is the default for `Stepper` and `StepList` (the builder, **the studio flow**, the new-quote sheet, onboarding — **every flow in the product unless it says otherwise**)". SKILL.md: "**A wizard does not gate**, and validation lands on the field." `Stepper.prompt.md`'s canonical studio example carries no `reachability`: "// Design studio, mobile — indicator + step-list sheet (SCR-M05-*) `<Stepper variant="indicator" current={step} onStepClick={setStep} onOpenStepList={…} steps={studioSteps} />`". And the @dsCard's FIRST specimen is `<p className="lbl">Desktop rail · M05-03</p>` → `<Stepper variant="rail" label="Design studio" current={step} onStepClick={setStep} steps={STEPS}/>` captioned "Default (`reachability="free"`): every row jumps, in any order." The gated twin is relabelled "KYC", moving the gate off the studio entirely.
The PRD rules the opposite, at P0, in the same table Stepper.jsx quotes M05-03 from. `prd/modules/M05-design-studio.md` / `ux/briefs/SCR-MS-03-studio-shell.md`, M05-05 (P0): "The studio **keeps** step gating: an invalid string design blocks the layout step's Next (§M05.7, M05-42). This is a ruled asymmetry with the proposal builder's free navigation (`R12` applies free navigation to the proposal builder only — `modules/M06`'s half); **the two must never be normalised into one behaviour.**" `prd/modules/M05-studio/07-step8-sld.md`, MS8-33 (P0): "error-level electrical issues block the editor's Next AND **clamp the reachable steps**, so an unsafe design cannot reach proposal or BOM", acceptance: "Given an error-level electrical issue, Then Next is blocked, **later steps are unreachable** … and the reason is plain." Gap 16's own quoted brief says it too: "The studio's electrical hard gate is `modules/M05`'s and is deliberately asymmetric — recorded, never normalised." Stepper.jsx's header comment cites M05-03 and M06-22 and never mentions M05-05.

**[…truncated]**

## Gap 17 · FacetChips + RangeField + FilterSet + FilterPanel

the one named for the filter set, copies the superseded layout. Fix is confined to that file — no component change needed.

## Gap 18 · rowIssue/rowResolved + onCellCommit + FieldOverride, hosted by DataTab · **functional, not documentation**

But four things the claim never checked break it below CLOSED.
(1) THE THIRD EDITOR IS UNUSABLE, AND IT IS THE ONE MS10-18 NEEDS. DataTable.d.ts documents `editor?: "text" | "number" | "select"`. CellEditor's select branch is `return (<Select density="functional" value={raw} options={col.options || []} error={issue || undefined} onChange={...} />);` — no `label`, while the twin path two lines below passes `aria-label={col.label}` on its `<input>`. SelectProps has no `aria-label` and Select.jsx destructures a fixed prop list with no rest spread, so its only accessible name is a visible `<label>` element the cell never renders: a select cell announces as a bare combobox holding "Nos" or "18%" with no column identity. Worse, Select.jsx renders its listbox inline — `style={{ position: "absolute", zIndex: 30, top: "calc(100% + 8px)", ... maxHeight: 260 }}` — with no portal, and its containing block sits inside DataTable.jsx's `const shell = { position: "relative", ..., overflow: "hidden", ... }`. Every select opened in the lower ~260px of a table is clipped away by the table's own shell. MS10-18's eleven editable BOM columns include `unit` and `GST %`, which are enumerations. inline-fix.card.html demonstrates only `editable:true` (text) and `editor:"number"` — the broken third path is precisely the one the canonical example omits.
(2) THE STALE RESET IS MISLABELLED, AND IT BREAKS THE LAW IN ITS OWN DOCSTRING. FieldOverride.jsx: `<LinkButton onClick={onReset} label={fieldName ? \`Reset ${fieldName} to ${stale ? newValue : autoValue}\` : undefined}>{stale ? "Keep mine" : ...}</LinkButton>`. Under `stale` the visible word is "Keep mine" but the accessible name is "Reset Module count to 19" — `newValue`, the DESIGN's figure, which is what the adjacent `onTake` button ("Take the new value for Module count: 19") does. A screen-reader user hears two buttons both promising 19, and the one that actually keeps their own 16 is the one announced as discarding it. Three teaching surfaces state the opposite rule: readme.md §5 ("**the reset**, a 44px target that names what it restores"), FieldOverride.d.ts ("3. **The reset** — \"Reset to 4.2 kWp\", a 44px target that **names what it restores**"), FieldOverride.prompt.md ("it **names what it restores**"). It also fails WCAG 2.5.3 — "Keep mine" is not contained in the accessible name.
(3) .d.ts AND .jsx DISAGREE ON `autoValue`. FieldOverride.d.ts: "/** The superseded value as a display string — \"4.2 kWp\", \"₹68,400\". */".

**[…truncated]**


---

## Deliverables

Corrections only — no new components.

> **Search the whole project for each old form** and paste every file that still contains it. Fix
> them and search again until empty. Include the unused half of a file.

Tell me, per gap: what you corrected, and which were already right.
