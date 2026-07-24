# 08 — Security & Tenancy

Binding companion to `BLUEPRINT.md` (§Auth, §Data layer, §Security & honesty). Sources:
[`./research/auth.md`](./research/auth.md), [`./research/journey.md`](./research/journey.md),
[`./research/integrations.md`](./research/integrations.md). Schemas referenced here are defined in
[`./04-data-model.md`](./04-data-model.md); billing states in [`./16-billing-and-entitlements.md`](./16-billing-and-entitlements.md).

---

## 1. Threat model

Ranked by (impact × likelihood) for a multi-tenant Indian EPC SaaS holding phone PII, deal values to ₹92L+, and BYO payment credentials.

| # | Threat | Vector | Impact | Mitigation (all mandatory) |
|---|---|---|---|---|
| T1 | **Cross-tenant data leakage** | Missing `tenant_id` predicate in one query; IDOR on a numeric/uuid id; PowerSync bucket misparameterisation | Another EPC's leads, prices, margins exposed — company-ending trust failure | Three-layer defence (§4): guard → tenant-scoped repo → RLS backstop. Locked invariant test: cross-tenant read AND write must fail (`tests/invariants/`). PowerSync sync streams parameterised by verified JWT `tenant_id`, never by client input |
| T2 | **Customer-link abuse** | D5/D33: customer never logs in; one tokenised link per deal. Any link-holder can view — and **Accept** — a proposal, incl. a ₹92L C&I order (D33 accepted risk). Forwarded links, leaked WhatsApp chats, guessing | Fraudulent acceptance, competitor price scraping, PII exposure | HMAC tokens (§6): unguessable (256-bit MAC), scoped, expiring, revocable via DB row. Accept re-validates server state. Rate-limited public routes. **Designed-for mitigation, schema-ready in v1, switched on in v2 or on first incident: named per-contact links + OTP-at-accept above a per-tenant value threshold (default ₹10L)** — `customer_links` carries `label` + `contact_id` (nullable) columns and the token payload reserves `otp_required`, matching [`./04-data-model.md`](./04-data-model.md); per-contact rows arrive with the named-links feature |
| T3 | **Webhook forgery / replay** | Attacker posts fake `subscription.charged` to grant themselves entitlements, or fake Exotel call events | Free service, poisoned ledgers | Razorpay: HMAC-SHA256 signature verify → dedupe on `x-razorpay-event-id` → reconcile-by-poll backstop (see [`./16`](./16-billing-and-entitlements.md) §5). Exotel/MSG91 callbacks: per-tenant/per-integration shared-secret verification + source allowlist + timestamp freshness ≤5 min + event-id dedupe. All webhook endpoints excluded from session auth, included in rate limits |
| T4 | **OTP abuse** | SMS pumping (premium-rate number farms burn our MSG91 balance), OTP brute force, invite spam | Direct money loss, account takeover | §7: per-phone/per-IP/per-tenant rate limits, 5-attempt verify lockout, +91 default allowlist, spend-velocity alarms, DLT-registered templates only |
| T5 | **Voice-agent social misuse** | Caller impersonates a customer to extract another customer's deal data; prompt injection via utterances or tenant knowledge base; agent used to harass (DND/hours violations); vishing our tenants ("HelioGrid support, read me your OTP") | PII leakage, TRAI penalties, brand damage | Agent context is scoped to the **single lead matched by verified caller number** — no cross-customer retrieval tool exists in the agent's toolset. Knowledge base is per-tenant, injected read-only; agent has no DB write tools beyond the call-outcome record. `ComplianceGate` (non-swappable, BLUEPRINT §Voice): DND scrub, 9am–9pm + holiday calendar, AI disclosure ≤30s, keypress opt-out. Recording retention 90 days. Support never asks for OTP — stated in every OTP SMS template |
| T6 | **Stolen device / session theft** | Field phones lost with 30–90 day mobile sessions | Tenant data exposure from one rep's scope | Sessions server-side in Postgres → revocable instantly from Team screen ("sign out everywhere" on deactivate). RN tokens in hardware keystore via react-native-keychain, never AsyncStorage. Short-lived JWTs (10 min) limit replay of intercepted API tokens |
| T7 | **Per-tenant credential theft** | BYO Razorpay keys / WABA tokens (v2) exfiltrated from DB backup or logs | Attacker drains tenant's payment flows | AES-256-GCM app-layer encryption with per-tenant DEK envelope (§8): ciphertext-only at rest, master key exists solely as a Fly secret on `api`, decrypt-in-memory at call site, never logged, access audit-logged |
| T8 | **SSRF via imagery proxies** | PVGIS/Gemini/Google Solar/geotiff relays coerced to fetch internal URLs | Internal network probe, metadata theft | Keep the POC's geotiff-relay guard: hostname allowlist per provider, no redirects across hosts, deny private IP ranges, response-type validation. All third-party calls are server-proxied — API keys never reach clients |

Non-threats we explicitly do not engineer for in v1: nation-state actors, malicious tenant *insiders* beyond role scoping (D28 forbids per-user exceptions; audit log is the compensating control), and DDoS beyond Fly/Upstash rate limiting.

---

## 2. Authentication

**Better Auth self-hosted** (v1.6.x) on our `bom` Postgres — phone PII stays in India ([`./research/auth.md`](./research/auth.md); [Better Auth 1.6](https://better-auth.com/blog/1-6)). Plugins: `organization` (tenants, members, phone invites), `phoneNumber` (OTP), `jwt` (JWKS).

### Phone-OTP flow (web and RN — one server flow)

1. User enters phone → server checks rate limits (§7) → MSG91 sends 6-digit OTP (SMS primary, ~₹0.15; WhatsApp-OTP retry channel for opt-in/failed delivery — [MSG91](https://productgrowth.in/tools/engagement/msg91/), [WhatsApp vs SMS](https://quickauth.in/blog/whatsapp-otp-vs-sms-otp-india)).
2. Verify (single-use, 5-min TTL, constant-time compare) → Better Auth session created → active organisation resolved → `tenant_id`.
3. Invited employee: invite row keyed by phone (Stage 1 journey) — OTP verify attaches membership + roles atomically.

DLT registration (principal entity + headers + templates) is a Launch-1 critical-path item: 1–2 weeks lead time, tracked in [`./14-build-roadmap.md`](./14-build-roadmap.md).

### Session models

| Surface | Mechanism | Lifetime | Storage |
|---|---|---|---|
| Web (Next.js) | Better Auth cookie session (`HttpOnly`, `Secure`, `SameSite=Lax`) | 30 days rolling | Server-side session row in Postgres |
| Mobile (bare RN) | Framework-agnostic Better Auth client + **custom storage adapter over react-native-keychain** (BLUEPRINT ruling; the `expo` plugin from the research is superseded by the no-Expo directive). Bearer session token | 90 days (field crews go offline for long windows) | iOS Keychain / Android Keystore |
| API calls (both) | Short-lived JWT minted by the `jwt` plugin, **10-min TTL, EdDSA, verified via JWKS** by NestJS guards and PowerSync | 10 min, silent re-mint from live session | Memory only |

JWT claims — the entire authz payload, nothing more:

```json
{ "sub": "<user_id>", "tenant_id": "<uuid>", "roles": ["sales_rep","surveyor"], "exp": ... }
```

Sessions are server-side rows → deactivating a user (or "sign out everywhere") kills every device inside one JWT TTL (≤10 min). PowerSync sync-stream parameters (`tenant_id`, assignee scope) come from this JWT only.

Week-1 spike (BLUEPRINT): phone-OTP on bare RN with the keychain adapter — the `phoneNumber` plugin has known RN rough edges ([#4679](https://github.com/better-auth/better-auth/issues/4679)); fallback is calling our OTP endpoints directly from RN.

---

## 3. Authorisation

Six fixed stackable preset roles, 16 capabilities (source: POC `product-journey.md` D27–D29 via [`./research/journey.md`](./research/journey.md)). **Manage billing returns as a live capability** — D38 is superseded; billing is v1 (see [`./15-spec-resolutions.md`](./15-spec-resolutions.md)).

| Capability | Owner | Manager | Sales rep | Surveyor | Designer | Engineer |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Lead visibility (scope) | All | Team | Own | Assigned | Assigned | Assigned |
| Add and edit leads | ✓ | ✓ | ✓ | — | — | — |
| Assign leads to others | ✓ | ✓ | — | — | — | — |
| Delete leads | ✓ | — | — | — | — | — |
| Capture site surveys | ✓ | ✓ | ✓ | ✓ | — | — |
| Create and edit designs | ✓ | — | — | — | ✓ | — |
| Approve designs (sign-off) | ✓ | — | — | — | — | ✓ |
| Create and edit proposals (incl. discounts, D34) | ✓ | ✓ | ✓ | — | ✓ | — |
| Send proposals to customers | ✓ | ✓ | ✓ | — | — | — |
| Update project stages | ✓ | ✓ | — | — | — | — |
| Record payments, upload documents | ✓ | ✓ | — | — | — | — |
| Configure the agent and its knowledge | ✓ | — | — | — | — | — |
| See agent performance | ✓ | ✓ | — | — | — | — |
| Manage team and roles | ✓ | — | — | — | — | — |
| Manage catalog and price book | ✓ | — | — | — | — | — |
| **Manage billing** (restored, D38 superseded) | ✓ | — | — | — | — | — |
| See company reports | ✓ | ✓ | — | — | — | — |

Rules (all product law, enforced in code):

- **OR across roles**: permission granted if any held role grants it. **Visibility = widest** scope among held roles.
- **No per-user exceptions, ever** (D28). Permissions derive purely from roles — there is no per-user override table in the schema, deliberately.
- **Deactivate, never delete** users. Deactivation revokes sessions and hides from assignment pickers; history keeps attribution.
- **Always ≥1 Owner**; always ≥1 person with Manage team. Both enforced as guarded transitions, not UI-only.
- Mid-task permission loss: current in-flight action completes; restriction applies from the next action (no mid-flight 403 storms).

Implementation: `@Capability('proposals.edit')` decorator → NestJS `CapabilityGuard` reads `roles[]` from the verified JWT and evaluates against a static preset→capability map in `packages/domain` (pure TS, injected — testable without Nest). Lead-visibility scoping is applied in the repository layer as a mandatory query predicate (`All`/`Team`/`Own`/`Assigned`), never in the client.

---

## 4. Tenancy — the three-layer defence

Single DB, shared schema, `tenant_id` on every tenant-owned row (BLUEPRINT §Data layer). No layer trusts the one above it.

**Layer 1 — request guard.** `TenantContextGuard` extracts `tenant_id` from the verified JWT and binds it to request-scoped context (AsyncLocalStorage). No handler ever reads tenant from params/body.

**Layer 2 — tenant-scoped repositories (primary).** All data access goes through `packages/db` repositories that take tenant context from ALS and append `WHERE tenant_id = $ctx` to every read and stamp it on every write. Raw `db.select()` outside a repository is a lint violation (dependency-cruiser rule + review rule in `.claude/rules/db.md`).

**Layer 3 — Postgres RLS (backstop).** Every tenant-owned table:

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;   -- table owner does NOT bypass

CREATE POLICY tenant_isolation ON leads
  USING      (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

Per request, inside the transaction the repository layer opens:

```sql
SET LOCAL app.tenant_id = '<uuid from verified JWT claim>';
```

`SET LOCAL` scopes to the transaction — pool-safe. Unset GUC → `current_setting` errors → query fails closed.

**BYPASSRLS warning (verified the hard way in research — [RLS multi-tenant](https://dev.to/josh_blair/multi-tenant-auth-with-cognito-and-postgresql-row-level-security-part-2-5d30)):** RLS silently no-ops for superusers and roles with `BYPASSRLS`. Therefore: the app connects as `heliogrid_app` (`NOSUPERUSER NOBYPASSRLS`, no DDL); migrations run under a separate `heliogrid_migrator` role in CI/deploy only; the postgres-flex default `postgres` superuser is never a connection string in any app. `FORCE ROW LEVEL SECURITY` is mandatory because the table owner otherwise bypasses its own policies. A startup assertion queries `pg_roles` and refuses to boot if the runtime role has `rolsuper` or `rolbypassrls`.

Exceptions: `platform_catalog_*` tables (shared, read-only to tenants) and Better Auth core tables carry no tenant RLS; admin/back-office paths use a separate service with its own role and explicit audit.

Locked invariant tests (thin-net exception, always green): cross-tenant SELECT returns zero rows even with a deliberately unscoped repo call; cross-tenant INSERT/UPDATE fails on `WITH CHECK`.

---

## 5. Customer links (no-login access, D5)

Entirely separate from auth — public routes never touch sessions or the RLS user context ([`./research/auth.md`](./research/auth.md) §Customer links).

**Token format — stateless HMAC:**

```
https://<app>/c/<base64url(payload)>.<base64url(HMAC-SHA256(secret, payload))>
payload = { lid: link_id, tid: tenant_id, sc: ["proposal.view"], cid: contact_id|null, exp, kid }
```

- Secret: 256-bit, Fly secret, keyring with `kid` for rotation — new tokens sign with the newest key; verification accepts any unexpired key; old keys retired after max token lifetime.
- Verification: recompute MAC (constant-time) → check `exp` → **then load the `customer_links` row** for revocation status and lifecycle stage. Stateless validity, stateful authority: a revoked/regenerated link dies instantly regardless of `exp`.
- Scopes: `proposal.view`, `proposal.respond` (Accept / Negotiate / Decline), `progress.view`, `handover.view`. One link per deal migrates through the lifecycle (journey C1–C13); effective rights = token scopes ∩ current link-row stage.
- Expiry: 12 months on view scopes; re-minting from the Share screen issues a fresh token for the same `link_id` (old token keeps working until its own `exp` unless regenerate-with-revoke is chosen).
- **Accept is never trusted from the token alone**: the server re-checks proposal is latest version, not stale (money-never-stale), lead not Won/Lost, and — when the v2 switch lands — runs OTP-at-accept for deals above the tenant threshold (T2). Acceptance writes an audit row with link_id + contact_id.

**Open tracking without PII leakage** (Stage 6 link tracking): opens logged server-side as `{link_id, ts, device_class}`; raw IP used only transiently for rate limiting, never persisted on the open event; public pages carry `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex`, zero third-party scripts/fonts/analytics; the token never appears in server logs (path scrubbing) and no customer PII appears in any URL. There is no "delivered" state — D32 honesty stands.

**Rate limits** (Upstash, per link_id and per IP): 60 views/hr per link; 5 respond-actions/hr; global public-route ceiling with 429 + backoff.

**Never block the customer link over the tenant's unpaid platform bill** — links stay live in every billing state ([`./16`](./16-billing-and-entitlements.md) §3, journey rule "chase the person, don't punish the view").

---

## 6. OTP anti-abuse

| Control | Value |
|---|---|
| Request rate — per phone | 3 / 15 min, 8 / day |
| Request rate — per IP | 10 / hour |
| Resend cooldown | 45 s |
| Invite sends — per tenant | 50 / day |
| Verify attempts | 5 per OTP, then OTP invalidated; 3 consecutive invalidations → 15-min lock on the phone |
| OTP shape | 6 digits, 5-min TTL, single-use, constant-time compare, hashed at rest |
| Destination | +91 allowlist by default; other country codes enabled per market rollout (global-ready switch, not a code change) |
| SMS pumping | Velocity alarm on MSG91 spend (>3× trailing-7-day hourly baseline pages on-call, see [`./09`](./09-observability-and-ops.md)); block known virtual-number prefixes |
| DLT | Only DLT-registered entity/header/templates — unregistered traffic is carrier-blocked anyway; MSG91 manages registration |
| Content | Every OTP SMS states the app name and "we never call to ask for this code" (T5 vishing) |

All limits live in Upstash with the fixed plan (eviction OFF — a rate-limit key must never be evicted into an allow).

---

## 7. Secrets management

- **Platform secrets**: Fly secrets per app (`api`, `worker`, `voice`, `powersync`) — DB URLs, Better Auth secret, JWT signing key, link-token keyring, MSG91/Exotel/Sarvam/Razorpay platform keys, Tigris credentials. Never in the repo; `.env.example` documents every var name (CLAUDE.md rule). Rotation: staged dual-read (new+old) → flip → retire, per keyring pattern above.
- **Per-tenant credentials** (BYO Razorpay key/secret + webhook secret now; WABA tokens in v2): **AES-256-GCM app-layer encryption with a per-tenant DEK envelope**. Ciphertext in Postgres (`tenant_integration_credentials` table: tenant_id, kind, ciphertext, key_fingerprint, created_by, rotated_at); each tenant's DEK is wrapped by a **master key that exists only as a Fly secret on the app that must decrypt** (api for payment-link minting; never web, never mobile). Decrypt in memory at the call site, zero after use, never logged, never returned by any API (write-only from the tenant's side — UI shows last-4 only). Every decrypt emits an audit event. Key rotation: re-wrap the per-tenant DEKs under the new master key in one migration job, then retire the old master key.
- Log hygiene: structured logger redacts `phone`, `otp`, `token`, `authorization`, `x-razorpay-signature`, credential ciphertext keys at the serialiser level.

---

## 8. OWASP Top-10 mapping

| OWASP 2021 | HelioGrid control |
|---|---|
| A01 Broken access control | Capability guards + tenant-scoped repos + RLS (§3–4); locked cross-tenant invariant tests; lead-visibility predicates in repo layer; no client-trusted ids |
| A02 Cryptographic failures | TLS everywhere (Fly edge); EdDSA JWTs via JWKS; HMAC-SHA256 link tokens; AES-256-GCM envelope-encrypted tenant credentials; OTPs hashed; no passwords exist at all (phone-OTP only) |
| A03 Injection | Drizzle parameterised queries only; Zod validation on every ts-rest boundary; no string-built SQL (lint-banned); Devanagari-safe output encoding via framework defaults |
| A04 Insecure design | This threat model; honesty/provenance rules as product law; ComplianceGate non-swappable; designed-for D33 mitigation pre-wired |
| A05 Security misconfiguration | Fly secrets; `NOBYPASSRLS` boot assertion; `FORCE RLS`; helmet defaults on Nest; separate migrator role; no debug endpoints in prod |
| A06 Vulnerable components | pnpm lockfile + dependabot + sherif (§10); Biome; minimal dependency policy |
| A07 Identification & auth failures | OTP rate limits + lockouts (§6); server-side revocable sessions; 10-min JWTs; keychain storage on RN |
| A08 Software & data integrity | Frozen lockfile in CI; **postinstall scripts disabled**; webhook HMAC + event-id dedupe + reconcile-by-poll; append-only migrations and usage ledger |
| A09 Logging & monitoring failures | Audit log (§11); structured logs with redaction; spend-velocity + webhook-failure alerts ([`./09`](./09-observability-and-ops.md)) |
| A10 SSRF | POC geotiff-relay guard ported: per-provider host allowlists, private-range deny, no cross-host redirects; all third-party calls server-proxied |

---

## 9. DPDP compliance posture

DPDP Act 2023 + DPDP Rules 2025. Position: **we are Data Fiduciary for tenant users' PII** (phones, names) and **Data Processor for the EPC's customer data** (the tenant is the fiduciary for their customers) — the DPA terms ride in our subscription agreement.

- **Residency**: primary DB (all PII, phone numbers via self-hosted Better Auth) on Fly `bom` — in India. Payment instruments never touch us (Razorpay, an Indian PA, holds them → RBI localisation satisfied).
- **Cross-border (Tigris `sin`)**: object storage (photos, PDFs, DEM tiles, backups) pinned single-region Singapore. DPDP Rules 2025 use a **negative-list model — transfer permitted by default unless the destination is blocklisted**; Singapore is not. Compliant today; the S3-compatible API gives a documented migration path to India-region storage if the list changes (BLUEPRINT §Database & infra). Decision recorded in `adr/` with review trigger "negative-list amendment".
- **Consent records**: per-customer voice-call consent, recording consent, DND/do-not-call flags with timestamps and source (D36 companion rules) — stored, surfaced pre-dial, exported on request. OTP SMS is transactional authentication traffic under DLT.
- **Data-principal rights**:
  - *Access/export*: tenant-level export always works regardless of billing state (product law). Individual data-principal export: support-backed workflow, JSON/CSV of all rows keyed to the principal, 30-day SLA.
  - *Correction*: in-app (lead/customer edit).
  - *Erasure*: verified request → **anonymisation, not row deletion** — PII fields overwritten (name → "Erased", phone → keyed hash for dedupe integrity), while financial/tax records (proposals, invoices, payments) are retained for statutory periods (GST: 6+ years). User accounts follow deactivate-never-delete; erasure applies the same anonymisation.
- **Breach duty**: notify the Data Protection Board and affected principals; runbook in [`./09`](./09-observability-and-ops.md). Grievance contact published in-app.
- Voice recordings: 90-day retention then hard delete (ComplianceGate), transcript retained on the timeline.

---

## 10. Supply chain

- **pnpm** with committed lockfile; CI installs `--frozen-lockfile` only.
- **Postinstall scripts disabled** (`pnpm.onlyBuiltDependencies` allowlist — empty until a package proves it needs one); no `curl | bash` anywhere in tooling.
- **sherif** in `pnpm turbo lint` — version drift across the workspace fails the build.
- **dependabot** weekly, security updates auto-PR'd; upgrades land only with green typecheck+lint+test.
- **dependency-cruiser** boundaries double as anti-exfiltration: `packages/domain` cannot import network/storage modules, so a compromised transitive dep in domain code has no I/O path.
- New runtime dependencies require justification in the PR body (consistency-over-cleverness rule).

---

## 11. Audit log coverage

Append-only `audit_log` (tenant_id, actor {user|agent|system|customer-link}, action, entity ref, before/after summary, ts). Written server-side in the same transaction as the mutation. Covered events — this list is the acceptance checklist:

1. Auth: OTP request/verify fail streaks, session revocations, user deactivation/reactivation.
2. Team: invite sent/accepted, role assignment changes (old→new set), last-Owner/last-Manage-team blocked attempts.
3. Tenancy: tenant settings, branding, catalog and price-book changes (price-book changes also create versions — versioning ≠ audit).
4. Money: proposal generate/send/version, discount applied (amount + who), tranche edits, payment recorded, mark Won/Lost/Cancelled-after-Won.
5. Customer links: mint, re-mint, revoke, open (coarse), Accept/Negotiate/Decline with link_id+contact_id.
6. Design: sign-off approve/return (who + when — this is the engineer-led structural safety record).
7. Agent: config changes (version id), knowledge-base edits, queue add/remove, DND/do-not-call/consent changes, escalations.
8. Billing: plan change, subscription state transitions, webhook events applied, entitlement overrides by support.
9. Credentials: tenant credential create/rotate/delete + every decrypt (§7).
10. Data rights: export requests, erasure requests and completions.
11. Admin/back-office access to any tenant's data (impersonation is read-only and always audited).

Retention: 24 months hot, then archived to Tigris (backup layer). The audit log is itself tenant-scoped and RLS-protected; tenants can export their own.
