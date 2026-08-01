> **⚠ OVERTURNED — DO NOT FOLLOW.** This file recommends **Crunchy Bridge and AWS S3, and rejects Tigris**. That direction was reversed by the verify-flyNative spike. **The shipped choices are Fly postgres-flex, Tigris (`sin`) and Upstash** — ADR-0007, ADR-0008. Retained ONLY as considered-alternatives evidence, plus its still-valid bom-capacity and DPDP notes.

# Fly.io Production Topology for India (verified July 2026)

## RECOMMENDATION — concrete topology

- **Compute:** Fly Machines in **`bom` (Mumbai)**, single-region to start. Web/API tier `min_machines_running=1` (do NOT scale-to-zero in bom — capacity is tight and cold restarts can fail there). Background workers as a **separate process group with `autostop="off"`**.
- **Database:** **Managed Postgres physically in AWS `ap-south-1` (Mumbai) — Crunchy Bridge (primary pick) or Supabase (if you want batteries-included).** Connect over TLS from Fly `bom`; both sit in the Mumbai metro, so latency is low single-digit ms and data stays in India. **Do NOT use Fly Managed Postgres (MPG)** — it is not in `bom`.
- **Object storage (survey photos / PII docs):** **AWS S3 `ap-south-1` (Mumbai)** — India-resident, same region as DB. **Not Tigris** (no India region) and **not R2** (no India region).
- **Redis:** **Defer.** Use Postgres-backed queue/cron (`graphile-worker` or `pg-boss`) in the always-on worker. Add **Upstash Redis (available in `bom`)** only when you need caching/rate-limiting/pub-sub at scale.
- **Internal networking:** 6PN `.internal` DNS + **flycast** for private service-to-service (with autostart). **Expansion later:** stay single-region `bom` for as long as your users are India-only; scale out with **`fly-replay`** + provider read replicas when needed.

## Evidence

**Fly `bom` Machines — operational but capacity-constrained.** BOM is a listed gateway region and shows Operational on status, but it is chronically high-demand: orgs report "region 'bom' cannot host your machine," scale-to-zero failing to restart, and it requires a **paid plan** (legacy/non-paid orgs are blocked). There was a `bom` egress-IPv6 incident on **July 20, 2026** (resolved). Implication: pin web tier to `min 1`, keep `sin` (Singapore) as an overflow fallback in `fly.toml`. [1][2]

**Fly Managed Postgres (MPG) — NOT in Mumbai.** As of July 2026 MPG is in ~12 regions (ams, fra, gru, iad, lax, lhr, nrt, ord, **sin**, sjc, syd, yyz) — **no `bom`**. It offers HA with automatic failover and automatic backups; PITR/read-replica specifics are thin in docs (PITR via Barman was a Postgres-*Flex* feature). Pricing: Basic $38/mo (1GB) → Performance $1,922/mo (64GB), storage $0.28/provisioned-GB-month, 1TB cap; since **Feb 2026 inter-region private-network egress is billed**. So MPG only helps if you accept `sin` (data leaves India + ~60ms/query on a chatty ORM). [3][4]

**In-India managed Postgres.** **Supabase has `ap-south-1` (Mumbai)** confirmed live in 2026 (managed, RLS, PITR + read replicas on paid tiers). **Crunchy Bridge** supports `ap-south-1` and is "plain Postgres" — cleanest fit for your pure-TS domain layer (no BaaS lock-in), strong HA/PITR ops. **Neon has NO `ap-south-1`** (nearest = Singapore `ap-southeast-1`) plus serverless cold-starts — reject for a low-latency India app. [5][6]

**Tigris — no India region.** Regions are US (sjc/ord/iad), EU (ams/fra/lhr), APAC (**sin/nrt**), plus syd/gru/jnb via Fly — **no `bom`**. You can pin a **single-region bucket** for residency, but the nearest you can pin is Singapore/Tokyo, i.e. **not India**. For DPDP-clean residency of homeowner survey PII, **S3 `ap-south-1`** is the correct choice (Cloudflare R2 also has no India region and only offers a coarse APAC location hint, US-jurisdiction company). [7][8]

**Upstash Redis** is reachable in all Fly regions incl. `bom` via private IPv6 — but for an early offline-first app a Postgres-based job queue removes a moving part. Keep Redis optional. [9]

**Cron / workers / autostop economics.** Machines *without* HTTP/TCP services are the right shape for queue workers and cron; run them as a process group with `autostop:"off"` so the web tier can still scale to zero without killing background work. Fly's **Cron Manager** (isolated machine per job) exists, but `graphile-worker`'s built-in cron inside your always-on worker avoids extra infra. Autostop saves money on the web tier; **don't** apply it to workers. [10][11]

## Alternatives rejected

- **MPG in `sin`:** managed + native private networking, but Singapore = data leaves India and ~60ms RTT per query. Only pick if you abandon residency.
- **Self-run Fly Postgres (Flex) in `bom`:** lowest latency + `.internal`, cheapest, but you own HA/failover/PITR (Barman). Too operationally fragile for an AI-agent-run production DB.
- **Neon:** no Mumbai region; cold starts. **Tigris/R2:** no India region.

## DPDP — residency is NOT legally required (but do it anyway)

DPDP Act 2023 + **DPDP Rules 2025 (notified Nov 13, 2025)** deliberately **rejected hard data localization**. Section 16 / **Rule 15** use a **negative-list model**: cross-border transfer of personal data is permitted by default, restricted only to specific countries the government later notifies. So a B2B SaaS holding Indian homeowners' PII has **no statutory obligation** to store it in India today. Caveats: (a) sector rules still bite — **RBI mandates payment-data localization** (relevant only once you handle payments; billing is deferred), and (b) **Significant Data Fiduciaries** may get extra restrictions by future notification. Full enforcement + penalties (up to ₹250 crore) land ~**May 2027**. Net: India residency is **preferred/best-practice** (customer procurement trust, future-proofing SDF/sector rules, and it happens to be the low-latency choice) — **not** mandatory. That's exactly why the S3-`ap-south-1` + Mumbai-Postgres topology is the sensible default: near-zero cost to comply, de-risks the future. [12][13][14]

## Sources
- [1] https://community.fly.io/t/region-bom-not-operational/27588 · [2] https://fly.io/docs/machines/guides-examples/machine-placement/
- [3] https://fly.io/docs/mpg/ · [4] https://community.fly.io/t/we-are-going-to-start-charging-for-mpg-inter-region-private-network-usage-from-febuary-2026/26561
- [5] https://supabase.com/docs/guides/platform/regions · [6] https://neon.com/docs/introduction/regions
- [7] https://www.tigrisdata.com/docs/concepts/regions/ · [8] https://community.fly.io/t/tigris-now-supports-restricting-object-storage-to-a-specific-region/20203
- [9] https://fly.io/docs/upstash/redis/ · [10] https://fly.io/docs/launch/autostop-autostart/ · [11] https://fly.io/docs/blueprints/task-scheduling/
- [12] https://en.wikipedia.org/wiki/Digital_Personal_Data_Protection_Rules,_2025 · [13] https://www.dpdpa.com/dpdprules/rule15.html · [14] https://ksandk.com/data-protection-and-data-privacy/indias-new-cross-border-data-transfer-framework/