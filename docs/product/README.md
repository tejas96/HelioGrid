# docs/product — vendored product truth

The requirement root. Everything here is product specification, not architecture and not
implementation guidance.

| File | What it is | How to read it |
|---|---|---|
| `product-journey.md` | Master spec: D1–D39 census, nine-stage journey, customer journey C1–C13, roles matrix | **Only through `../15-spec-resolutions.md`** — ~40% of the D-text is superseded |
| `studio-census.md` | The binding studio-port acceptance gate (ADR-0017) | As a literal checklist; the census never shrinks |

Per-module extractions in `../modules/<module>/specs/d-decisions.md` are the intended
per-task access path — they quote the relevant D-decisions verbatim with their `docs/15`
status already applied, at a fraction of the token cost of reading the master spec.
