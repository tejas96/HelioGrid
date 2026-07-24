# Rules — testing (deliberately thin; product-owner decision)

No routine unit-test authoring until the post-release testing program is designed.
This is a scope decision, not an oversight. What exists, and the ONLY things that may exist:

## 1. Ported POC domain tests (packages/domain)
Travel with the ported code, unmodified except imports/context injection. They encode
hard-won invariants — one-frame gate, frame parity, skeleton area conservation, eave
continuity, structure/BOM golden files, electrical windows, azimuth-lattice attacks.
Never delete, skip, or loosen one to make a port "pass". A failing ported test means the
port is wrong.

## 2. The locked invariant set (tests/invariants/)
Small, named, frozen list. Additions require explicit user approval.
- **money**: BOM total == proposal total == Σ tranches (to the paisa); GST per-line math
  (margin below GST, discount pre-GST pro-rata); subsidy slabs (PM Surya Ghar incl. DCR
  rule); payable = cost + battery − subsidy − discount; payable ≤ 0 blocks generate;
  tranches must total 100%; sent proposal keeps prices after price-book update.
- **tenancy**: with RLS on, tenant A's session cannot read or write any tenant B row on
  every tenant-scoped table (generated over the schema, not hand-listed); customer-link
  token for deal X cannot read deal Y; role capability matrix matches D27 presets.
- **billing**: Razorpay webhook duplicate delivery does not double-grant/double-charge;
  entitlement state machine (trialing → active → past_due → halted; terminals:
  cancelled, expired) transitions only on allowed edges; usage_events are append-only.
- **migrations**: fresh-apply == schema snapshot; demo project seed → normalize → persist
  round-trips stable.

## 3. Nothing else
No new unit tests, no component tests, no e2e suites, no coverage targets. Verification
of features = typecheck + lint + invariants green + running the actual app (browser /
simulator / curl) and looking. When tempted to write a test, verify in the running app
instead and note the manual check in the PR/commit description.
