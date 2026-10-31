# SCR-M12-01 · Pricing Page

Public per-market tier/price/cap comparison; states all features in every tier.

**Module:** M12 · Platform billing · **Personas:** Prospect (unauthenticated visitor evaluating the product), EPC Owner (evaluating an upgrade — the buyer and only billing administrator, `docs/prd/modules/M12-platform-billing.md` §2) · **Context of use:** public web surface, pre-auth (`docs/prd/04-business-model.md` §2: "the public pricing page"); read on any device — a prospect comparing tools on a phone as readily as an owner at a desk. Copy exists in every launch language; amounts render in the tenant's/market's currency with the market's grouping (`docs/prd/04-business-model.md` §04.1 localization notes).

**One job:** see what each plan costs and how much it lets me do, and start a trial.
**Order of attention:** 1 the one claim — every feature is in every plan — and the four plans with their prices · 2 how much each plan lets me do · 3 how the price compares, and how to start.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. This is a
public page and it is still not a manual: its claim is one line, and its proof is the numbers.

| Fact | Kind | Its form here |
|---|---|---|
| Every module is in every plan; a plan sets capacity, never features (`BM-05`) | data | ONE line under the title — the page's single claim, which is also the statement `BM-05` requires the page to make about how others ransom capabilities into higher plans. What "everything" holds is a row that opens in place — never a feature grid with a tick in every cell |
| Each plan — name, who it is for, price for the chosen cycle | data | one card per plan; ONE positioning line per plan (`BM-14`'s plan-keyed copy) |
| Billing cycle | action | a two-way selector, and under it ONE data row from `BM-13` — `Yearly — 12 months for the price of 10` (owner ruling). While the platform is not GST-registered no tax line shows; once it is, prices exclude tax — said once, `Prices exclude GST` at the plans region's foot (`F1-29`, owner ruling 2026-10-30). No saving is computed, and no percentage is printed |
| Every published cap, bundle and overage rate (`BM-07`) | data | each plan's card shows the two limits that differ most, and an `All limits` row opens the full list in place. Comparing at 375 is TWO plans side by side, each chosen by a selector, with a selector for limits, monthly bundles and overage rates — never a four-plan matrix behind a pager |
| Service terms per plan | data | a `Support` row in each plan's list — plan-keyed screen copy, never a book value (`BM-14`) |
| A rate the book marks draft | data | a named gap — never a draft figure on a public page, never a zero |
| Trial caps | data | label–value rows behind a `During the trial` row that opens in place: 15 voice minutes, 5 GB, biggest design 100 MW, proposals not capped |
| Start a trial — no plan choice, no card, no mandate (`M12-14`) | action | ONE `Start free trial` act for the whole page, not one per plan: the trial is not tied to a plan. ONE line at the button says how long it runs and that no card is needed (`M12-52` context) |
| Enterprise is sales-assisted (`BM-14`, `BM-15` context) | action | its card's act is `Talk to sales`, never a checkout |
| How the price compares (`BM-39`, `BM-44` context) | data | a `Compared with` region: label–value rows, our plan beside the named benchmark at the same capacity, each benchmark figure carrying its own source label and date. No adjectives, no paragraph about anyone |
| Provenance (`F8-07`) | honesty label | once per region, at its foot — the price list's name and date, one quiet source line and no tier (owner ruling 2026-10-29: a price-list figure carries none), never a key above the figures. A benchmark figure differs, so it carries its own source line |
| No price list resolves for the visitor's market | teaching | the page says no prices are published for this market yet, and offers `Talk to sales`; never an empty grid, never another market's prices |
| The price list failed to load | error | the plans block's failed read — what failed, and `Try again` inside it (the one read state, `T-SHELL-013`; owner ruling 2026-10-29). No stale and no invented number |

## Arrangement

- **No shell.** A public page, before sign-in: it carries its own header — the wordmark, the language
  switch, `Sign in` — and the drawing report says so.
- **375.** The title and its one claim · the cycle selector · the four plans as cards · `Compare two
  plans`, a row that opens the two-plan comparison · `Compared with` · the trial act, pinned at the
  foot with its one line. The comparison's three selectors — `Plan`, `Against`, `Show` — sit together
  directly above its grid.
- **1536.** The four plans side by side. The full four-plan matrix is ONE region with the three-way
  selector — not three tables stacked down the page. `Compared with` sits beside it. The trial act
  lives in the page header. The trial caps stand open under `Compared with`, on its value edge.
- **Density.** Expressive for the page; functional for the comparison and the matrix, at both widths.

## Sample data — the book's rows, drawn and never invented

The plan names, the trial's length, the tax rate and every price, limit, bundle, rate, trial cap and
benchmark on this page are these rows' values. A frame that shows a name or a figure these rows do
not carry is wrong.

- **BM-11** (P0) — **Four tiers, fixed names: Starter · Growth · Pro · Enterprise.** The names are market-neutral structure and suite-wide vocabulary — every market's price book prices these same four tiers in its own currency (F1-25), every entitlement is keyed to them (M12), every report that segments by plan uses them (M13). No market renames, adds or removes a tier; a market that cannot serve a tier's capacity has no book for it (which is a book-authoring decision, not a product change).
- **BM-41** (P0) — **The India book — the source-derived first instance (IN book; every number below is IN-market data, not the generic model).** Identified by `F1-60`/`F1-61`; canonical here. **Tier prices (INR, ex-GST):** Starter **₹1,999/mo · ₹19,990/yr** — Growth **₹3,999/mo · ₹39,990/yr** — Pro **₹9,999/mo · ₹99,999/yr** — Enterprise **custom, anchored ₹24,999+/mo**, annual contract (owner-set anchors ~₹2k/~₹4k/~₹10k). **Capacity + counts:** single-design ceiling 50 kW / 500 kW / 5 MW / 100 MW (utility: blocks/zones, trackers, terrain); proposals 30 / 300 / 1,500 / unlimited per month; active projects 10 / unlimited / unlimited / unlimited; users unlimited on all four. **Bundles + overage:** no AI-detection bundle or rate (BM-19, owner ruling 2026-10-31); voice minutes PAYG ₹6/min on Starter and Growth, 400 min/mo bundled then ₹6/min on Pro, custom bundles + BYO number on Enterprise; storage 10 / 50 / 250 GB / custom. **Trial caps:** 15 voice minutes · 5 GB; **proposals are not capped in the trial** (owner ruling 2026-10-08 — a proposal costs the platform little and is the trial's moment of value). **Service terms are pricing-page copy, not book data (owner ruling 2026-09-07):** the IN positioning — support in-app / in-app + WhatsApp / priority + onboarding call / named contact — is rendered by the pricing page as Tier-keyed screen copy per BM-14; the book carries none of it and no entitlement, invoice or gate reads it, and a second market whose terms differ carries them as pack labels (`F1-22`), never in a locale-keyed catalog. Enterprise adds the BM-15 commercial arrangements. **Benchmarks (recorded per BM-39):** Reslink India INR page (owner-supplied, authoritative — Basic ₹60,000/yr at 50 kW · Pro ₹85,000/yr at 500 kW, 1,000 proposals · Premium ₹1,20,000/yr at 5 MW · Enterprise custom) and ARKA per-org pricing; priced under both at every rung — Starter-yearly 67% under Basic, Growth-yearly 53% under Pro, Pro-yearly 17% under Premium with a voice bundle no competitor has, and Pro's 1,500 proposals/mo beat the benchmark's 1,000. **Collection routes:** per the IN mandate ladder, F1-40 (monthly self-serve under the per-debit cap rides UPI AutoPay; Enterprise e-NACH/invoice; every yearly total exceeds the cap and is a single payment link/invoice per year). **V2 add-on prices (owner ruling 2026-08-04 — base tiers confirmed unchanged; every add-on number below is DRAFT pending rate-card verification per BM-17/BM-26):** tracked seat **≈₹99/seat/mo** beyond the tier's included allowance; **included tracked seats: Starter 0 · Growth 3 · Pro 10 · Enterprise custom**; marketing-send bundles **Starter 500 · Growth 2,000 · Pro 10,000 sends/mo**, overage **≈ WhatsApp ₹1.5 · SMS ₹0.35 · email ₹0.10 per send**. A draft add-on rate is not sellable until the owner verifies the channel/seat rate cards against worst-case unit COGS (the ≥40% floor, BM-17) — verification is the revisit trigger.
- **BM-13** (P0) — **Every tier bills monthly or yearly.** Yearly = pay for 10 months, get 12 — two months free (~17% saving), one collection per year. All prices are exclusive of the market's tax scheme (F1-13; IN: ex-GST at the scheme rate, F1-28). Which rail collects which cycle is market-pack data, not product law (IN: monthly rides the mandate ladder, every yearly total exceeds the mandate cap and is collected as a single payment link/invoice — F1-40).
- **BM-14** (P1) — **Tier positioning laws** (each tier has a job): **Starter** is the "every EPC" tier — a 1–5 person residential shop runs its whole business on it, and outgrowing its caps IS the upgrade signal. **Growth** is the default recommendation past roughly 15 installs a month or the first small C&I work. **Pro** is the C&I tier, carrying the voice bundle no competitor offers at any price. **Enterprise** is for the largest single designs, open-access and utility work — sales-assisted, annual contracts. Positioning informs bundle sizing and pricing-page copy — the per-tier service terms are that copy, rendered by the pricing page as Tier-keyed screen copy under the i18n convention and never read from the book (BM-41; owner ruling 2026-09-07); it never creates a feature difference (BM-05).
- **M12-52** (P0) — **The trial is modelled in-app only; the gateway subscription is created at conversion.** 14 days, every tier capability, within the trial caps (book data — `BM-41`); no card or mandate to start; one 7-day extension available to support (an audited override, M12-19's family).
- **F1-28** (P0) — The IN tax scheme is **GST**, strategy `per_line_rate`; the tenant tax-registration type is `IN_GST`. All platform prices are **ex-GST**; platform SaaS subscriptions and overage add-ons carry **SAC 998434 (cloud/SaaS) at 18% GST**.

**A price list value's trust label.** A figure the price list publishes — a price, a bundle, a rate, a cap — carries no tier (owner ruling 2026-10-29): its region names the list and its date as one quiet source line, prose and never a tier. The date is sample content, because a price list is versioned data (`F1-25`): draw `India price list · 1 Apr 2026`. No figure on the billing screens shows a provenance tier label — `measured`, `derived`, `estimated` or `assumed` — not a computed amount either (owner ruling 2026-10-29, for billing only; the rest of the product keeps `F8-01` for now). Where this brief asks for it, a computed amount shows its working in `How it is worked out`.

**The trial's biggest design is 100 MW** — the top plan's ceiling (owner ruling 2026-10-29): `BM-41` names no trial ceiling, and `M12-52` gives the trial every plan capability. Anything else `BM-41`'s trial caps do not cap — proposals, active projects, users — is not capped on a trial.

## Entry & exit

Reached from: the public web — the PRD names the pricing page as an M12-owned public surface (`docs/prd/04-business-model.md` §2) but does not pin inbound navigation; decision 1 settles it. Leads to: the trial funnel — the PRD's analytics events for this surface are "pricing-page tier viewed; trial started; trial converted" (`docs/prd/04-business-model.md` §04.1), and signup itself carries no plan choice, card or mandate (M12-14); Enterprise is sales-assisted (BM-14/BM-15 context), so the Enterprise column's action is a sales contact, never self-serve checkout. Decision 1 settles every exit.

**Decisions made in design — later screens inherit them.**

1. **In, and out.** IN: a public URL only, with no in-app entry — the signed-in equivalent is `SCR-M12-03`. OUT: `Start free trial` routes to company signup (`SCR-M01-02`), which carries no plan choice, card or mandate (`M12-14`); `Sign in` routes to `SCR-M01-01`; `Talk to sales` opens the market pack's sales address, a route with no screen of its own; the language control changes the page in place.
2. **Nothing on this page is ever picked, so the plans are content cards and not a radiogroup.** There is one trial act for the whole page. The card is the calm-screens card below (*The plan card is NOT inherited*): the name, the price as its headline figure in mono with its period beside it, the limits as one flowing line — with this page's own parts added: the positioning slot, a `Support` row, an `All limits` row that grows the card in place (owner ruling 2026-10-29).
3. **No shell at either width.** The page carries `SCR-M01-01`'s pre-auth header — wordmark, language control, `Sign in` — and at 1536 the trial act and its one line sit in that header instead of a pinned foot.
4. **The trial act is present only where there are prices to read.** In loading, in a market with no book and after a failed load it is absent rather than disabled: what the trial allows is the same book's data.
5. **A plan that bundles no voice minutes reads `None`, not a named gap.** The book prices voice per minute on Starter and Growth, so the included amount is a real zero and the rate is one chip away in `Extra charges`. A named gap is kept for what is genuinely missing.
6. **The benchmark page's date is sample content**, on the same grounds the brief already gives the price list's (`F1-25`): drawn as `Reslink India price page · 12 Mar 2026`.
7. **The matrix carries its period with the value; the card carries it in the label.** A card reads `Voice minutes a month · 400`; the table, whose label column is 112px at 375, reads `Voice minutes · 400 / mo`. This is `SCR-M12-03`'s own split between its cards and its comparison.
8. **Product facts this brief did not carry were named, not invented:**

- **The positioning lines** are `BM-14`'s per-plan law in the person's words, owner-approved: Starter — *For a home-rooftop team of 1 to 5 people.* · Growth — *For 15 or more installs a month, or your first business sites.* · Pro — *For business sites, with voice minutes included.* · Enterprise — *For the largest designs and utility work.*
- **Tracked seats and marketing sends** are `BM-41`'s V2 add-ons and every one of their numbers is DRAFT. A V1 public page prints neither; this is what the `A rate the book marks draft` row is about. `## Data volume`'s mention of them describes the book's full grid, not this page's V1 rows.

9. **The claim is the page's one sentence**, 13 words over the ten-word guide: `BM-05` requires the page to say it, so the fact wins over the budget.
10. **`All limits` grows the card's one row group in place**, 2 rows to 8, one form and one value edge; its chevron turns, nothing hangs on hover. At 1536 the four-plan table stands in for `All limits`, so the cards carry no such row (owner ruling 2026-10-31).
11. **Comparing at 375 is three chip strips together** — `Plan`, `Against`, `Show` — directly above the table they change; `Against` never offers the plan chosen in `Plan`. At 1536 the four-plan table is the answer and there is no `Compare two plans` row.
12. **`Compared with` is one group of six rows**, `<plan> · <capacity>`, pairing the two yearly figures; the book's percentages, the 1,500-against-1,000 proposals and the voice-bundle claim are not drawn.
13. **GST is said once, and only once the platform is GST-registered**, `Prices exclude GST` at the plans region's foot, absent before (`F1-29`, owner ruling 2026-10-30); the 18% rate and SAC 998434 belong on invoices.
14. **Loading, no book, and error.** In loading the header, title, claim and `What every plan includes` stay — none is price-list data — and the cycle chips and the trial act are absent, not disabled. With no book for the market, the comparison, `Compared with` and the trial act go with the prices. Loading is the plans `Block` loading (`Loading the prices`); error is its failed read with `Try again`.
15. **The plan card is the design system's `Card`**; Enterprise's `Talk to sales` is a secondary button on that card. At 1536 the four cards stand at one height.
16. **The draft-rate frame is a sample market**, labelled as one: its book leaves the per-minute voice rate draft, so that row reads `Not published yet`. The India book has no draft V1 rate — its draft rates are V2 add-ons a V1 page does not print — so no India frame shows `Not published yet`.
17. **The source line of a price-list figure is `Provenance` `unmarked` with its `source`** — no tier word printed (owner ruling 2026-10-29).
18. **Motion.** `What every plan includes`, `All limits`, `During the trial` and `Compare two plans` open in place with their chevron turning; a cycle or comparison chip swaps the figures in place with no motion; loading bars give way to the plans in place (`F7-51`: every motion is the design system's; nothing waits on it, and a figure never animates).

**Inherited from `SCR-M12-03` (designed) — reuse, never redraw.**

- **The comparison is `SCR-M12-03`'s** — my plan, or here a chosen plan, against ONE other at 375; all four plans as columns at 1536; the same set words `Limits` · `Included` · `Extra charges`.
- **The plan card is NOT inherited.** It is the calm-screens proposal's: the name, the price as the card's headline figure with its period beside it, and the limits as ONE flowing line, `Limits — 50 kW · 30 proposals a month`. `SCR-M12-03` drew the same object as a mono price row and three label–value rows; the owner moved both screens to this form (2026-09-20). The headline figure is mono with tabular figures (`F7-09`). This page adds what is its own: the positioning line, `Support`, `All limits`, `Compared with`.
- **The cycle and every one-of-N choice is a chip strip**, directly above what it changes. The person's words: `Included`, `Extra charges` — never "bundle", never "overage".
- **Honesty labels:** the source line `India price list · 1 Apr 2026`, no tier (owner ruling 2026-10-29), with `Prices exclude GST` as its own element once the platform is GST-registered.

## Design system gaps

Owner ruling 2026-10-29: a board draws the nearest real component, never a look-alike, and the screen's build adds the missing part to `packages/ui`. *Canvas behind the repo* means the repo already has the part and only the canvas copy lacks it.

- `DoorLanguage` — canvas behind the repo; the board draws `Menu` with a ghost `Button`.
- `Block` `retryLabel` and `loadingLabel` — canvas behind the repo.
- `CompareGrid` `numeric` right-aligns no figure, in the repo or on the canvas; the `Extra charges` money column must end on one right edge (`F7-09`).

## Requirements (verbatim)

### docs/prd/04-business-model.md

- **BM-05** (P0) — **Every module is in every tier. Tiers gate capacity ceilings + usage counts + metered bundles — never features** (owner-confirmed). Every feature is in every tier: CRM and projects, the full studio (shadow analysis, all obstruction types, tin-shed/metal-roof, ground mount, structures, SLD + AC/DC and earthing layouts, industrial drawing sheets, PV/energy reports, DXF/SVG/PDF export), customer links, all languages — and the V2 additions (marketing, field workforce, HR) enter under the same law. Competitors ransom capabilities into higher tiers; the pricing page says so. _(non-UI half, build-side: tiers gate capacity/counts/bundles, never features — every module every tier — for awareness, not for drawing)_
- **BM-07** (P0) — **Caps are upgrade signals and abuse bounds, never feature ransoms.** Every cap is visible and generous, published on the pricing page and on the usage screen; outgrowing a cap IS the upgrade signal. Enforcement is soft-block with read + export always working (§04.5). _(non-UI half, build-side: caps are upgrade signals and abuse bounds; soft-block enforcement — for awareness, not for drawing)_
  _Shared row: BM-07's usage-screen half lands on SCR-M12-04._

## States

- **loading** — book data (prices/caps/bundles) not yet resolved for the market.
- **empty** — no authored market book resolves for the visitor's market; the PRD defines one price/cap source of truth (the market book, BM-09/BM-41 context) but does not pin this page's no-book behavior — decided here: the page says no prices are published for this market yet and offers the sales contact; never an empty grid, never another market's prices.
- **error** — book data failed to load; honest failure, no stale or invented numbers.
- **normal** — the four-tier comparison: every cap published and visible per tier (BM-07), with the "every module in every tier / competitors ransom capabilities, we don't" statement the page is required to make (BM-05).
- **monthly-yearly-toggle** — the page presents both billing cycles; every tier bills monthly or yearly (BM-13 context: yearly = pay for 10 months, get 12; prices exclusive of the market's tax scheme). On yearly, Enterprise keeps its monthly anchor: the book publishes no yearly figure for it.
- **benchmark-comparison** — competitor benchmark rows cited on the page; every equivalent-capacity comparison must be lower-priced and traceable to the book's recorded benchmarks, with benchmark provenance shown (`docs/prd/04-business-model.md` §04.7 acceptance criteria and localization notes; BM-39/BM-41/BM-44 context). Each rung pairs the two yearly figures and adds nothing: the book's percentages are not printed.
- **gst-registered** — `normal` once the platform is GST-registered, scrolled to the plans region's foot: `Prices exclude GST` beside the source line. Every other frame draws today's platform, which is not registered, and prints no tax line (`F1-29`, owner ruling 2026-10-30).

Drawn at 375 only (at 1536 the phone's answer holds at width): `loading`, `empty`, `error`, `monthly-yearly-toggle`, `gst-registered`.

## Data volume

Design at the full IN book grid (`docs/prd/04-business-model.md` BM-41): 4 tiers × 2 cycles, each tier carrying on the order of a dozen published values — monthly and yearly price, single-design kW ceiling, proposals/month, active projects, users (unlimited), voice minutes (PAYG rate or bundle), storage, included tracked seats + per-seat rate, marketing-send bundles + per-channel overage rates, trial caps, service terms (Tier-keyed screen copy, never a book value — BM-14, BM-41) — plus competitor benchmark rows per tier. The comparison must stay legible at that density on a phone.

## Numbers and their source

No figure on these screens carries a provenance tier label (owner ruling 2026-10-29, for billing only). Billing screens use plain "actual usage" language — the word "measured" never appears (owner ruling carried in M12-34). Each region names its source once, at its foot:

- Tier prices, monthly and yearly, and every cap, bundle, rate and trial cap — `India price list · 1 Apr 2026`, with `Prices exclude GST` as its own element once the platform is GST-registered.
- Benchmark figures — each with its own source line and date (`Reslink India price page · 12 Mar 2026`), traceable to the book's recorded benchmarks.
