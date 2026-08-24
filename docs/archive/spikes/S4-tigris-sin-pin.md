# Spike S4 — Tigris single-region pin (`sin`)

**Date:** 2026-07-25 · **Verdict: BLOCKED-ON-OWNER — bucket creation is billable and was
declined this session; mechanics documented, ready to execute.**

## What this spike must prove

`fly storage create` (or the Tigris console) can produce a bucket **hard-pinned to `sin`**
(single region, no global distribution) — the CLI flag naming is under-documented
(docs/03 §8), which is the entire reason this is a spike.

## Doc-level findings (to verify hands-on)

- Tigris supports region restriction via the `X-Tigris-Regions` header on
  bucket creation, and post-hoc via `aws s3api put-bucket-* --endpoint ... ` custom
  metadata, per Tigris docs (tigrisdata.com/docs/buckets/locations). The flyctl path
  (`fly storage create`) does not obviously expose a region flag — expectation is that
  the pin is applied via the Tigris dashboard or an S3 API call after creation.
- Acceptance: create bucket → set/verify `sin` restriction → upload an object → confirm
  via Tigris dashboard/API that placement is `sin` only.

## Why blocked

Bucket creation attaches billable storage to the Fly org; owner declined billable
provisioning this session and will provision infra themselves.

## Ready-to-run once infra exists

```bash
fly storage create --org <org> --name heliogrid-objects
# then verify/enforce the sin pin via X-Tigris-Regions and record the EXACT working
# command sequence in this note — that record is the spike deliverable.
```

DPDP note (unchanged): cross-border object storage is permitted (negative-list model);
primary PII stays in the `bom` Postgres. RBI payment-data localisation is satisfied by
Razorpay holding instruments.
