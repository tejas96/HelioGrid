# SCR-M01-15 · Catalog Settings

The one two-tier catalog surface: browse, search, rates panel with tier attribution, overrides, archive, release publish, price-book versions.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner, Operations, Finance · **Context of use:** catalog administration is web-emphasis — dense lists are desktop-first per M01 §2's UXG-01 note — with one-tap acts (archive, toggle preferred/hide) first-class on mobile. Permission split per DD11: catalog administration is `F2.M01.manage-catalog` (EPC Owner + Operations); Finance views prices & margins and never administers; a person without the manage grant sees administration actions absent (M01 §M01.4 permissions).

## Entry & exit

Reached from: the tenant-config settings surface map — *Catalog · Price book* are named surfaces in M01 §4's stable vocabulary; a deeper entry path is not pinned by PRD — designer decides, note the decision. Leads to: **Add Catalog Item** (SCR-M01-16) — inline add is available from Catalog settings as well as the pickers (M01-39); **Catalog Import Wizard** (SCR-M01-17) — Catalog settings is one of the wizard's three entry points (M01-41, §M01.4 behavior detail); release publish and price-book version browsing happen on this surface (M01-43, M01-48, §M01.5 behavior detail: "The price book renders as the rates panel of the one catalog surface").

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-32** (P0) — **One catalog surface, two tiers, one resolution order.** The catalog a tenant sees is resolved as: **tenant override → tenant own item → platform item**. Platform master catalog (curated by the platform) + tenant own SKUs + sparse tenant overrides collapse into one browsing/search surface with a rates panel — never two catalogs to administer. The old spec's duplicate catalog row is void (R13). _(non-UI half, build-side: resolution order: tenant override, then own item, then platform item — for awareness, not for drawing)_
- **M01-34** (P0) — **Items carry typed per-kind engineering specs with scheme-keyed certifications, and pickers badge compliance.** Platform items are curated with typed specifications per component kind; certifications are **scheme-keyed** on the spec — the tenant market's pack declares which schemes apply (F1-19; the IN pack declares its two schemes with list references and flags, F1-44) — and every picker and search result badges compliance per those schemes. An empty scheme set means no badges, never an error. Brand and model names are never translated (F3-08). Platform items are read-only to tenants (overrides are the only tenant-side write on them, M01-37). _(non-UI half, build-side: typed per-kind specs; certifications scheme-keyed from pack declaration; empty scheme set means no badges — for awareness, not for drawing)_
- **M01-35** (P0) — **Every catalog item carries a data-provenance label.** Platform-curated items carry verified-datasheet provenance; tenant-entered items carry tenant-provided provenance; representative/sample data is labelled as such. The label is honest about where a spec came from and rides into the picker (F8 surfaces it; `F8-14` consumes it). Provenance labelling — not gatekeeping — is what does the accuracy work in a self-serve catalog (design spec §9). _(non-UI half, build-side: three-value provenance enum: verified-datasheet, tenant-provided, representative — for awareness, not for drawing)_
- **M01-37** (P0) — **Overrides on platform items are sparse: price, tax rate, hide, preferred.** A tenant override carries only the fields the tenant changed — an unset field falls through to the platform value; one override per platform item. Visibility (hide) removes an item from that tenant's pickers without touching the platform item; preferred pins it forward in search and picker ordering. _(non-UI half, build-side: sparse override: unset fields fall through; one override per platform item; hide affects pickers only — for awareness, not for drawing)_
- **M01-38** (P0) — **Unified search spans both catalogs, filterable to either.** One search over the platform slice + own SKUs together, with filters: source (platform / own), component kind, key spec ranges (e.g. wattage, technology), certification-scheme badges (per the market's declared schemes), preferred, archived. Search behaviour is shared with the picker (DD12) — the picker searches this catalog, with these filters. _(non-UI half, build-side: one search over both tiers, preferred-first ranking, shared with the DD12 picker — for awareness, not for drawing)_
- **M01-43** (P0) — **Catalog releases are labelled and append-only; designs and proposals pin the release they used.** Publishing catalog changes produces a labelled release; the release label rides into every design fingerprint and proposal version that used it, and a release publish **self-stales** every design pinned to an older label (staleness law F8-13/F8-14 — staleness is derived by comparison, never silent recompute). Sent proposals keep their pinned versions forever (F8-15). _(non-UI half, build-side: append-only labelled releases; designs and proposals pin release; publish self-stales older-pinned designs per F8 — for awareness, not for drawing)_
- **M01-48** (P0) — **The price book holds versioned rates for everything that is not a catalog item.** Non-component rates (service and installation charges, engineering fees, per-kW adders and comparable non-catalog rates) live in the tenant price book as **immutable versions**: a price update creates a new version, never mutates rates in place; exactly one version is active per tenant; a default margin percentage rides the version. Rates are denominated in the tenant's one currency (F1-07). _(non-UI half, build-side: immutable price-book versions, exactly one active, default margin rides version, single currency — for awareness, not for drawing)_

## States

- **Loading** — the resolved catalog list, rates panel and filters being fetched.
- **Empty / empty-teaching** — a fresh tenant before any own SKU or override: the platform market slice still renders (there is never "no catalog"); teaching empty treatment applies to the own-SKU/override dimensions per F7's empty-state contract.
- **Error** — a load or edit fails; what happened and what to do next.
- **normal** — one resolved list: platform slice + own SKUs + overrides collapsed into one browsing/search surface with a rates panel (M01-32); provenance labels visible per item (M01-35); compliance badges per the market's declared schemes, and no badges when the scheme set is empty (M01-34).
- **search-filtered** — unified search active with filters: source (platform / own), component kind, key spec ranges, certification-scheme badges, preferred, archived (M01-38); preferred items rank first, archived items appear only under the archived filter (§M01.4 behavior detail).
- **rates-panel-tier-attribution** — the rates panel shows, per item, which tier supplied each field (platform value struck under an override, own-SKU values plain) so an owner can always answer "why is this price showing" (§M01.4 behavior detail); sparse override editing: price, tax rate, hide, preferred (M01-37).
- **archived-filter** — archived items surfaced by the archived filter only.
- **archive-warns-referenced-drafts** — archiving from settings warns when the item is referenced by open drafts (count shown) and proceeds without breaking them (§M01.4 behavior detail).
- **release-publish-summary** — publishing catalog changes is an explicit act producing a labelled release — human-readable name plus date — with a summary of what changed (M01-43; §M01.4/§M01.5 behavior detail).
- **release-contents-inspect** — what a release contains (which items changed) is inspectable (§M01.4 behavior detail).
- **price-book-version-browse** — past price-book versions are browsable read-only; exactly one version is active; the default margin rides the version (M01-48; §M01.5 behavior detail).

**Decisions made in design (2026-09-01) — later screens inherit them.**

1. **One destination, two panels.** *Catalog* is the one row in the settings surface map; *Price
   book* is not its own destination. At 375 the two panels switch with a `SegmentedControl`; at 1536
   the rates panel sits **beside** the list. `M01-32` forbids two catalogues to administer and
   §M01.5 calls the price book *the rates panel of the one catalog surface* — the switch exists only
   because 375 has no *beside*.
2. **`empty` on the items panel is not an empty list and never will be.** A tenant's first day
   already has the platform slice (`M01-32`: there is never "no catalogue"), so what is empty is the
   tenant's own two dimensions — own SKUs and overrides — and the teaching card sits above a full
   list.
3. **An archived row claims no price tier.** Its price is not what anyone would be charged, so it
   renders `unmarked` — the reserved value that records a deliberate absence — rather than a
   `measured` that is true of a number nobody can use.
4. **Publishing asks for a name, not a serial** (`M01-43`: a release is a human-readable name plus a
   date), and states the consequence as a number before the act: *N designs pinned to <label> will
   show as out of date*. A release's contents are a **before-and-after**, not a list of names — a
   tier on each side.
5. **The three row acts are 32px at 1536 and 44px on the phone card.** The design system's one
   in-row exception, whose three conditions all hold: a `<table>` row, pointer-only, and the same
   acts at full size elsewhere.
6. **Returning from `SCR-M01-16` and `SCR-M01-17` lands on the panel and scroll position the caller
   was on.** Written into both briefs.

## Data volume

The PRD fixes no item count for the catalog; it does classify catalog administration as dense-list, desktop-first territory (M01 §2, UXG-01 pattern) and makes search-with-filters the primary navigation (M01-38). Design at list scale — a full market slice of platform items across component kinds plus the tenant's own SKUs and overrides — not at a handful of cards. The rates panel additionally carries the price book's non-component rates (service and installation charges, engineering fees, per-kW adders and comparable rates, M01-48).

## Numbers carrying provenance

Each of these is user-visible on this screen and carries its F8 provenance tier in the design:

- **Effective (resolved) price per item** — resolved through tenant override → own item → platform item (M01-32); tier attribution shown in the rates panel (platform value struck under an override).
- **Override price and tax rate** — tenant-entered override fields (M01-37).
- **Item spec values** (e.g. wattage, technology as filterable spec ranges, M01-38/M01-34) — each item's provenance label (verified-datasheet / tenant-provided / representative) is exactly this screen's honesty mechanism (M01-35).
- **Price-book rates** — service/installation charges, engineering fees, per-kW adders, from the active immutable version (M01-48).
- **Default margin percentage** — rides the price-book version (M01-48).
- **Release label + date** — the publish act's human-readable name plus date (M01-43, §M01.4 behavior detail).
- **Open-draft reference count** shown in the archive warning (§M01.4 behavior detail).

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried `Offline / offline-read-only` and `offline-edit-fail-fast` states and a Context-of-use sentence splitting cached reads from online-only edits (`F4-08`, `F4-09`, `F4-18`). All are deleted. `M01-43`'s release self-staling is version staleness, not cache staleness, and is untouched.*
