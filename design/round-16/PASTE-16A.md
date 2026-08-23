Three capabilities, and they are one subject: **what happens when this product puts something on a
page a customer keeps.** A proposal PDF, a drawing sheet, a customer link page — the artefacts
that outlive the session and get forwarded, printed and argued over.

§1 is the largest single item left in the system. §2 and §3 are things that live on the page §1
makes, so they belong in the same round.

**Don't ask me how it should look.** The system owns that.

## Patterns already settled — compose with these, don't re-answer them

- **`RichText` / `RichTextView`** — closed mark set, editor and read-only renderer.
  **`RichText.measure(value)` and the `pageEstimate` slot are a seam left deliberately for §1.**
- **`PreviewFrame`** — a framed, scaled, non-interactive window onto customer-facing output.
- **`CustomerSurface` + `TenantHeader`** — tenant branding on a whole customer page.
- **`DocumentPreview`** — the branded quotation specimen, with `letterhead` and parts.
- **`Provenance`** · **`NamedGap`** · **`UnavailableNote`** · **`ComplianceFloor`**.

## 1 · A paged document and print surface

`tokens/` has **no print file**, and `tokens/base.css` contains **no `@media print` rule of any
kind**. `DocumentPreview` is the nearest name and is a branded quotation specimen, not a page
engine.

Nine things it has to do, beyond page geometry and a title block.

**(1) Identical on screen and on paper.** `M06-50` makes the preview *"exactly what the customer
will see"*, and `SCR-M06-15`'s volume note says *"multi-page pagination — **pixel-for-content
identical** to what the customer's rendering will show."*

**(2) A title block.** `MS9-01`: *"proposal number, issue date, version/revision, validity period,
prepared-by with company identity, and the **customer-facing project name — never the internal
design or variant name**."*

**(3) Counted sheet numbering.** `MS9-02`: *"Pagination is **counted, not hardcoded**: sequential
unique page numbers, no duplicates, and **no trailing blank page in the PDF**."*

**(4) Print scoping in both directions.** `SCR-M06-13` has details that *"save but **will not
print**"* — a print-suppressed region. `MS9-16`'s staleness warning **prints, and is never
print-suppressed**. So the surface needs both, and the second must not be defeatable.

**(5) What must not break across a page:**

- a BOM line — `SCR-M06-14` has forty of them: item, spec, qty, unit, rate, tax, total;
- **a table's caption *and* header, repeated on every continuation page** — `DataTable` cannot do
  this today (`caption` is *"overline caption above the table"*, with no repeat-on-break);
- a figure and the provenance label `F8-07` requires beside it;
- the verbatim disclosure lines (§2);
- an image and its caption — `Image`'s `ratio` + `lazy:false` already hold that footprint, and the
  page surface must not undo it.

**(6) Optional and conditional pages.** `MS9-25`: *"the SLD page is **offered only when a real SLD
exists**"*, plus `MS9-03`'s drawing pages.

**(7) Audience variants of the same pages.** `MS9-04` — customer versus internal, and *"the
internal view is **never the default** for a customer artefact."*

**(8) One content, two renderings.** `F5-39`: *"the customer link always renders the proposal as
web — **PDF is an artifact, never the only path to the number**"*; `M06-51`: *"the link renders the
same content as web."* So the surface must degrade to a **continuous web page carrying identical
content** — not a second authored document.

**(9) Two kinds of sheet, not one.** The drawing sheets are their own thing: *"zoom either works or
is not advertised; paper size, scale and sheet numbering consistent across every sheet and title
block"* (`MS8-02`), *"the structural disclaimer travels on **every** sheet"* (`MS8-08`), and *"the
legend lists **only symbols the sheet actually renders**"* (`MS8-17`).

**One coupling to close, deliberately left open two rounds ago.** `RichText` shipped with
`measure(value)` returning `{chars, words, blocks, headings, listItems, hasLogo}` and a
caller-supplied `pageEstimate` footer slot that renders nothing when empty. That seam exists for
this component. `M06-15`'s cap is *"up to 3 pages"* with a readout of *"char count · ≈ PDF page
estimate"* — **now is when the estimate stops being a guess.** Say what fills the slot and how the
estimate is computed against real page geometry.

**Scope note:** the drawing sheets in (9) render a canvas, and the canvas is a later round. Build
the **sheet** — geometry, title block, numbering, legend, disclaimer — and leave the drawing itself
a slot, the same way you left `pageEstimate`. Say what shape you left.

## 2 · The flagship honesty line is currently dismissible

> `M06-04` (P0), `SCR-M06-17`: *"'A proposal built without a design must say so. **Not in fine
> print — visibly, on the document**': every Path B document renders the fixed line, **verbatim**"*
> — drawn as `indicative-disclaimer-path-b`: *"the verbatim indicative line on every Path B
> document, **in the reading flow at the same visual weight as the figures it qualifies**."*

The row frames it as *"a genuine competitive advantage, not a disclaimer"*. Three siblings share
the obligation: the remote-survey basis line, `MS9-17`'s structure disclaimer *"wherever structure
or mounting is quoted"*, and `MS9-16`'s staleness warning.

`Banner` is the wrong instrument, in four separate ways:

- **It is dismissible by design.** `Banner.d.ts`: `dismissible` is *"opt-in only. **Ignored for
  validation, data-integrity and below-cost** — those three don't stop being true because a user
  tapped the cross."* `Banner.jsx`'s `NEVER_DISMISSIBLE = ["validation","data-integrity",
  "below-cost"]` is **the guard, not the default** — and `disclaimer` is not on it.
- **`BannerStack` can suppress it.** `mode: "single"` is *"the broadest true fact speaks"* and
  `max` caps the rest — a mechanism for hiding a true mandatory statement.
- **It is operator chrome, and this surface bans that.** `MS9-11`: *"The link opens the customer's
  own surface — not the operator's editor chrome: **no operator-only alerts**."*
- **A tinted, glyphed strip is the wrong weight.** The brief asks for the reading flow at the
  weight of the figures, not an alert above them.

**Separately, and please do this too:** the `NEVER_DISMISSIBLE` list needs to grow to cover the
billing kinds. `SCR-SHELL-06` renders its banner *"whenever the tenant is in a trial countdown, a
post-expiry soft block, past_due grace, cap-ladder or halted state"*, and `BM-32` makes it **the
guaranteed way back**. A dismissible way-back is not one.

## 3 · Forty lines that add up to nothing

An earlier pass cleared `DataTable` for the 40-line BOM on `caption` + `stackBelow` + the pager,
and never asked **what the forty lines add up to**.

> `SCR-M06-14`: *"**BOM total ↔ proposal price** — reconciles under the locked invariants… **a
> disagreement is a defect, not a display difference**."*
>
> `M06-35` (P0), `SCR-M06-05`: *"cost + battery − incentive − discount = payable, **recomputing on
> every change**"* — an itemised equation, not a single stat.
>
> `SCR-M06-17`: *"Money summary: system cost, tax, incentive/subsidy amount, discount, payable…
> **zero never renders negative**."*

Live: `DataTable`'s `total` is **the pager's record count**. There is no footer row, no sum slot,
and no way to mark a row as the total — so the one row that **must not sort, must not stack away
and must not paginate** has no expression at all.

Three things to carry:

- The total is **load-bearing content on the same surface as the lines**, at *"a 40-line BOM… at
  phone width, without a wide table"* — and the stacked card form currently has nowhere to put it.
- It must survive a **page break** (§1 item 5) — a total orphaned onto its own page is a defect.
- **Zero never renders negative**, and a discount that exceeds the cost is a real input.

Six screens across two modules need this block.

---

## Deliverables

Same conventions: `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` with realistic Indian solar
content, and the cards updated so changed parts render with real content.

> **Do not judge for yourself which files teach a behaviour.** For each item, **search the whole
> project for the old form** — the literal string or prop you just replaced — and paste the list
> of every file that still contains it. Fix every one, then search again until the list is empty.
>
> Search all of it: `.jsx`, `.d.ts`, `.prompt.md`, every `*.card.html`, everything under
> `templates/`, `readme.md`, `SKILL.md`, `_ds_manifest.json`. **Include the unused half of a
> file.** If a search comes back empty, say so — that is the evidence, not the claim.

Tell me:

- for **§1**, the page model, how the web rendering carries identical content without being a
  second document, what fills `RichText`'s `pageEstimate` slot, and the shape of the slot you left
  for the drawing;
- for **§2**, what the disclosure component is, why it cannot be suppressed, and the new
  `NEVER_DISMISSIBLE` list;
- for **§3**, how the total is expressed, how it survives stacking and a page break, and what
  happens when a discount exceeds the cost.

If any item is already fixed since my read, say so plainly rather than redoing it.
