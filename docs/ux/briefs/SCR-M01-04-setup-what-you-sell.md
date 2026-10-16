# SCR-M01-04 · Setup — What You Sell

One step: Residential / C&I / both plus typical system size to seed defaults.

**Module:** M01 · **Personas:** EPC Owner · **Context of use:** part of company onboarding — laptop-leaning but fully mobile-capable (M01 §2); the whole setup philosophy is minimum-first: ask for the minimum to produce one real proposal (M01 §1, `S0.rule.minimum-first`). Two questions, nothing more (M01 §M01.3 behavior detail).

## Entry & exit

Reached from: directly after signup's three fields — "after M01-01's three fields, the only further onboarding steps are M01-23 (two questions), the skippable M01-24, the skippable invite step (M01-12), and the two-door landing (M01-26)" (M01 §M01.3 behavior detail). Leads to: the skippable Business Profile step (SCR-M01-05) in that sequence. **Position, clarified in design 2026-08-28:** `SCR-M01-03`'s language picker sits between signup and this step — it is the only thing in between, and this is the first step that asks about the **business**. **This step is not skippable and draws no Skip control:** the sequence names its skippable steps — the business profile and the invite step — and this is not among them, because these two answers are what seed the defaults, so a skipped step hands the first proposal figures nobody declared. **No back control**, matching the step before it: nothing here is irreversible, so a back control would be a second route to something already reachable forward.

**Further decisions made in design (2026-08-28) — later screens inherit them.**

1. **Continue commits both answers; nothing is written before it.** Unlike the language step — where choosing applies immediately because the screen redrawing *is* the confirmation — there is nothing here for an early write to prove. The size field commits its own draft on blur or Enter; the step is recorded on Continue.
2. **Continue stays live with nothing answered.** `M06-22` (P0) already killed the Next-disabled rule, so a refusal is a state with its own frame, never a grey button on the default one. The refusal rings each question and names the fix at it.
3. **Both questions are visible at once.** A step that *is* two questions has nothing to disclose progressively; revealing the size only after a segment is chosen would make a short step feel long and hide the screen's only tiered value until late.
4. **The cards describe the business, not the defaults they seed.** Explaining what each option seeds would need kWp figures, panel counts or price bands — untiered numbers, on the screen that exists to collect the one declaration they derive from. *Both* is a full option, never a compromise.
5. **No step counter.** The count is computable and still not drawn: the language step sits inside this sequence and is absent from the sequence the brief quotes, so the total is not settled — and a position in a corridor carries no tier that could honestly qualify it.
6. **Loading holds one fact, so it holds no shape — this screen carries no skeleton.** Nothing about the *content* is unknown: the three business kinds and the size field are product law, not a fetched set. The only unknown at first paint is whether this tenant has declared before, so the questions stay live and answerable and only the act waits. **Build rule: a read that lands fills only what the user has not touched** — otherwise a selection appears under a finger.
7. **`empty` is the default frame.** *Nothing arrived* is impossible here — there is no collection that can come back empty — so empty means *no declaration yet*, which is the state every new tenant opens in.
8. **A failed save is the only failure drawn, and in it the failure takes the heading.** Both answers stay on screen: a first-run screen that loses typed answers to a network is worse than the network. It names no connection — that is the shared full-screen surface the design system owns.

**The screen's one number, and its tier.** The typical system size is **`estimated`, sourced "Declared by you"**. It is not the recorded-and-untiered case: that carve-out is for **recorded values** — dates and times somebody wrote down — and this value fails the carve-out's own test — what is recorded is a *guess about a typical job*, not a record of one job. Not `assumed` either, which would claim the platform picked it. The tier is a property of the field, not of the keystroke: it renders under the field before there is a figure and does not move when one arrives. **An undeclared field is empty, never `0`** — a number whose tier cannot be established is not rendered as a number. **Build consequence: every default this declaration seeds inherits from an estimate, and nothing downstream may present a seeded figure at a stronger tier than the declaration it came from.**

**Two things this screen could not answer, both ruled 2026-08-28 and now applied.** The unit is **`kWp`**, not `kW` — the two are different quantities and the difference is 10–30%, which residential hides and C&I does not, on a screen that asks about both. The declarations are edited afterwards in the **company profile, `SCR-M01-05`** (`M01-23`), which is what the *change this later* line and the failed-save *Finish later* route now point at. **Both are redrawn (2026-08-28) and re-measured:** `kWp` reads on all eight frames as label and suffix with no bare `kW` left, and the company profile is named under Continue, in both error bodies and in both `aria-label`s at both widths and in Marathi. The unit stays `kWp` in Marathi — a unit is a quantity, not a word to localise, which is this brief's own never-translate rule reaching the same answer. Because `SCR-M01-05` is the very next step in this corridor, *Finish later* now moves the owner **one step forward** rather than sideways into the product — which is what makes the escape honest without making this step skippable.

**Build note — design-system gaps this screen found.** One is open, in `docs/tasks/UI.md`: a field `error` on `NumberField` and `OptionCardGroup` is described, not announced. Two are closed in the port (`T-M01-004a`): a `NumberField` with no value is unset, and `Provenance` takes `emphasis: 'load-bearing'`. And one rule stands: a unit is part of the number, so it is load-bearing and never `--text-tertiary` (`F7-11`).

**Rulings made in the build (owner, 2026-10-11) — the board and later screens inherit them.**

1. **`Continue` opens the company profile (`SCR-M01-05`), and so does `Finish later`.** `Finish later` records nothing: the step is put off for the session and the next sign-in asks for it again, unless both answers were given on the company profile meanwhile (that brief's ruling 42). The words are the board's as drawn and name the company profile.
2. **The screen is built on the door frame**, at a `list` measure of 560: the task column is the board's width, and the identity half keeps the frame's own width and place.
3. **The failure takes the heading at every width, as one block, as the board draws it at 375**: the danger block holds what went wrong as the page's heading in the danger ink, the error's ask at the row's far end, and the fix sentence under them, said as one alert. At 1536 the block stands in the question's place, where the board keeps the question above it.
4. **A size of 0 or less, or over 999,999.99, is unanswered**; the size holds two decimals. The field has no bound of its own: `Continue` refuses at the field with its one line.
5. **On a refusal the web moves focus to the first unanswered question; the phone says that question's error once.** The 1536 initial focus is not built.
6. **The buttons carry no spoken name**: the visible word is the name, and the line at the act and the ask say the rest.
7. **The Marathi tier word is the product's, `अंदाजित`**, wherever the tier prints; the board's `अंदाजे` is a working word.
8. **At 1536 a failed save keeps the door frame's rule**: the identity half takes its full width when it holds the fix, so the wordmark and the heading start further left than at rest, as on the language step.
9. **The door frame's spacing stays**: at 375 the heading sits about 69 px under the wordmark where the board has about 43, and at 1536 the task column sits about 18 px lower than the board's — one frame for every door. **After a failed save the block sits `sp-4` under the wordmark, as the board draws it** (the frame's `near` column): the block is taller than the title, and at the frame's own spacing the tier line fell under the fold on a phone.


## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-23** (P0) — **"What do you sell?" seeds defaults.** One step: Residential / C&I / both, and typical system size — used to seed sensible defaults so the first proposal is close. Stored as the tenant's segment + typical-kW declarations. **The unit is `kWp`, and the declarations' later home is the company profile (owner ruling 2026-08-28).** **`kWp`, not `kW`:** the two are different quantities — `kWp` is the DC array at peak, `kW` is the inverter's AC output, and DC runs 10–30% above AC. In residential the two are used interchangeably and land close; in C&I they do not, and this row's own step asks Residential / C&I / **both**. The value seeds the studio's target capacity, which `M05-39` states in `kWp`, so a `kW` declaration would need a DC/AC ratio no row specifies. It is also the market-neutral choice, which a global product needs: `kW` means the sanctioned array in one market and the inverter rating in another, and a stored value whose meaning changes per market is exactly what `F1`'s pack model forbids — while `kWp` is what EPCs price in (per-`kWp` installed) in every market. This row previously read *typical system size* and *typical-kW declarations*; the quantity is unchanged and only the unit is named. **Where they are edited afterwards:** the company profile, `SCR-M01-05` (`M01-24`) — the tenant's one write-point that consumers read by reference and never re-ask (`M01-31`). The row previously named no surface at all, which left `SCR-M01-04`'s *change this later* line and its failed-save escape pointing at nothing.

## States

Base: **loading** · **empty** · **error** (empty/error states carry F7's teaching-empty-state contract — M01 behavior detail).

Drawn at 375 only (at 1536 the phone's answer holds at width): `loading`, and the refusal — Continue pressed with nothing answered.

Screen-specific:

- **normal** — the one step: segment choice (Residential / C&I / both) plus typical system size (M01-23).

## Data volume

Two inputs: one three-way segment choice and one typical-system-size value (**kWp** — owner ruling 2026-08-28; this line read `kW` before it). This is the entire screen — onboarding steps are skippable moments, not a wizard that must complete (M01 §M01.3 behavior detail).

## Numbers carrying provenance

Every rendered number carries its F8 provenance tier in the design. The typical system size (**kWp**) is the tenant's own declaration, stored as the tenant's segment + typical-kW declarations (M01-23); the kW unit is never translated (M01 §M01.4 localization notes context). No money or date renders here.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
