# ADR-0007: Object storage — Tigris, single-region pin `sin`

Date: 2026-07-24

## Context

Object storage holds survey photos, proposal PDFs, DEM tiles and database backups. The research preferred AWS S3 `ap-south-1` for strict India residency; the product owner's binding directive is **Fly-native services only initially (no AWS)**. Tigris has no India region — the nearest pinnable region is Singapore (`sin`). DPDP Rules 2025 (notified 13 Nov 2025) adopted a **negative-list model**: cross-border transfer of personal data is lawful by default, restricted only to countries the government later notifies.

## Decision

**Tigris (Fly-native, S3-compatible) with a single-region bucket pinned to `sin`.** Presigned URLs and multipart uploads are verified and carry the PowerSync Attachments flow (offline photo capture → resumable presigned PUT) and the pgBackRest/`pg_dump` backup targets (ADR-0006). Placement is controlled via bucket location config / `X-Tigris-Regions`; confirming the exact single-region pin flags through `fly storage create` is a listed week-1 spike.

**Compliance position, recorded**: DB (and therefore all phone PII and relational personal data) stays in India; object storage in `sin` is lawful under the DPDP negative-list default; RBI payment-data localisation is satisfied because Razorpay (an Indian licensed PA) holds payment instruments, not us (ADR-0013).

## Consequences

- Zero egress fees, native Fly integration, one bill, one network fabric.
- Personal-data-bearing objects (survey photos of homes) sit outside India. Lawful today; two watch-items make the exit real, not theoretical: (a) a future negative-list notification, (b) Significant Data Fiduciary designation with added restrictions. Because everything speaks the S3 API, migration to an India-region S3-compatible store is a bucket-copy + endpoint swap — the path is documented in `08-security-and-tenancy.md`.
- `sin`→`bom` object latency (~60ms) is irrelevant for presigned client uploads/downloads; it mildly slows server-side backup pushes — acceptable.
- Enterprise customers who contractually demand in-India object storage cannot be served on this bucket — deal-qualification note for sales, revisit trigger for this ADR.

## Alternatives rejected

- **AWS S3 `ap-south-1`** — the research's residency-clean pick; rejected by the no-AWS/Fly-native directive. Remains the documented migration target if the negative list or an enterprise contract forces it.
- **Cloudflare R2** — no India region either, coarse APAC placement hint, and not Fly-native; strictly worse than Tigris here.
- **Storing blobs in Postgres** — bloats the deprecated-flex DB we must back up ourselves; photos belong in object storage with references synced (PowerSync Attachments pattern).

## Sources

- `../research/fly.md` (incl. DPDP negative-list analysis) · `../research/verify-flyNative.md`
- https://www.tigrisdata.com/docs/buckets/locations/ · https://www.tigrisdata.com/docs/objects/object_regions/ · https://fly.io/docs/tigris/
- https://docs.powersync.com/client-sdks/advanced/attachments
- https://www.dpdpa.com/dpdprules/rule15.html · https://ksandk.com/data-protection-and-data-privacy/indias-new-cross-border-data-transfer-framework/
- BLUEPRINT.md — Final-review directive 2 (Fly-native only)
