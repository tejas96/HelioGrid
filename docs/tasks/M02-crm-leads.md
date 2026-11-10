# M02 · CRM & Leads — engineering tasks

This file covers module M02 — CRM & leads. Its V1 tasks shipped together in build-order block 3; what stays here is the module's two laws, the row realized elsewhere and the disposition index. The capture-channel policy behind M01's settings surface (M02-17, M02-64, M02-65) builds with that V2 screen, in `T-M01-022`. Task-id prefix: `T-M02-`. Source doc: `docs/prd/modules/M02-crm-and-leads.md` (rows M02-01 … M02-67).

---

## Laws (enforced through screens and review, no standalone build)

- **M02-27** (P0) — **Assignment is manual. There is no auto-routing and no rules engine in v1.** The source's assign screen offers "pick a rep, or use a rule"; the rule half is superseded — *"Assignment is manual, with each rep's open load visible at the moment of assigning. No auto-routing rules in v1"* — and `UXG-04` states the design consequence plainly: **"no rules engine."** Round-robin, territory routing and load balancing are non-goals (§5), not unbuilt features.
  *Enforced by:* the assign picker built in T-M02-002 / T-M02-011 offering only a manual choice, and product-wide review against the PRD's own check: "Given the product as a whole, when it is inspected, then no auto-assignment, round-robin or routing rule exists on any surface (M02-27)."
- **M02-38** (P1) — **A lead's estimated value is a forecast input and is never revenue.** It renders as a weighted-pipeline input wherever it is shown, carries its provenance and provisional state like any other money figure, and never appears in a won total.
  *Enforced by:* M13's forecast surfaces (which own the weighted-pipeline reading) and the shared money rendering rules of `docs/prd/foundations/F8-data-honesty.md` (`F8-23`, `F8-12`); review of any surface that totals revenue. No dedicated Given/When/Then line exists for M02-38 in the PRD's acceptance blocks; the requirement text above is the binding criterion.

---

## Realized elsewhere

- **M02-45** (P1) — **A renting customer is usually disqualified — with the landlord captured as a contact if offered.** The product does not decide it for them: the reason exists in the six, and the landlord contact exists on the record, so a rented roof that can still be sold is not thrown away.
  *realized-by:* M02-42 (the "renting" disqualify reason, T-M02-004) and M02-34 (additional contacts with role labels such as landlord, T-M02-004).

---

## Disposition index

| Row | Disposition |
|---|---|
| M02-01 | `T-M02-001`, shipped |
| M02-02 | `T-M02-007`, shipped |
| M02-03 | `T-M02-001`, shipped |
| M02-05 | `T-M02-001`, shipped |
| M02-06 | `T-M02-001`, shipped |
| M02-07 | `T-M02-008`, shipped |
| M02-08 | `T-M02-008`, shipped |
| M02-09 | `T-M02-008`, shipped |
| M02-10 | `T-M02-008`, shipped |
| M02-11 | `T-M02-008`, shipped |
| M02-12 | `T-M02-008`, shipped |
| M02-13 | `T-M02-009`, shipped |
| M02-14 | voice — postponed |
| M02-15 | `T-M02-010`, shipped |
| M02-16 | `T-M02-009`, shipped |
| M02-17 | T-M01-022 (V2) |
| M02-18 | `T-M02-005`, shipped |
| M02-19 | `T-M02-005`, shipped |
| M02-20 | `T-M02-005`, shipped |
| M02-21 | `T-M02-005`, shipped |
| M02-23 | `T-M02-002`, shipped |
| M02-24 | `T-M02-002`, shipped |
| M02-25 | `T-M02-002`, shipped |
| M02-27 | LAW |
| M02-28 | `T-M02-002`, shipped |
| M02-29 | `T-M02-002`, shipped |
| M02-30 | `T-M02-011`, shipped |
| M02-31 | `T-M02-011`, shipped |
| M02-32 | `T-M02-004`, shipped |
| M02-33 | `T-M02-013`, shipped |
| M02-34 | `T-M02-004`, shipped |
| M02-35 | `T-M02-012`, shipped |
| M02-36 | `T-M02-012`, shipped |
| M02-37 | `T-M02-007`, shipped |
| M02-38 | LAW |
| M02-39 | `T-M02-004`, shipped |
| M02-40 | `T-M02-003`, shipped |
| M02-41 | `T-M02-015`, shipped |
| M02-42 | `T-M02-004`, shipped |
| M02-43 | `T-M02-010`, shipped |
| M02-44 | `T-M02-010`, shipped |
| M02-45 | realized-by: M02-42, M02-34 |
| M02-46 | `T-M02-014`, shipped |
| M02-47 | `T-M02-013`, shipped |
| M02-48 | `T-M02-013`, shipped |
| M02-49 | `T-M02-015`, shipped |
| M02-50 | `T-M02-015`, shipped |
| M02-51 | `T-M02-015`, shipped |
| M02-52 | `T-M02-015`, shipped |
| M02-53 | `T-M02-015`, shipped |
| M02-54 | `T-M02-015`, shipped |
| M02-55 | `T-M02-015`, shipped |
| M02-56 | `T-M02-015`, shipped |
| M02-57 | `T-M02-015`, shipped |
| M02-58 | `T-M02-015`, shipped |
| M02-59 | `T-M02-006`, shipped |
| M02-60 | `T-M02-016`, shipped |
| M02-61 | `T-M02-016`, shipped |
| M02-62 | `T-M02-016`, shipped |
| M02-63 | `T-M02-006`, shipped |
| M02-64 | T-M01-022 (V2) |
| M02-65 | T-M01-022 (V2) |
| M02-66 | `T-M02-008`, shipped |
| M02-67 | `T-M02-002`, shipped |
| F4-16 | T-M02-012 (moved from T-FPLAT-012) |
| F4-19 | T-M02-012 (moved from T-FPLAT-012) |
