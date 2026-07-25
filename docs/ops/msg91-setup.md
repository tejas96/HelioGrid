# MSG91 — OTP setup state & DLT flip-on playbook

**Configured (2026-07-26, workspace `beyondnyx`):**
- Dedicated authkey **`heliogridDev`** (Owner rule, IP security OFF for dev) — value in
  `.env.local` as `MSG91_AUTH_KEY`. Production gets its own key with IP security ON,
  whitelisting Fly egress IPs.
- Wallet balance ₹50 (top up before real sends).

**DLT-gated (honestly blocked — the console requires confirming PE-TM DLT registration,
which has not happened yet):**
1. **Sender ID / header** — proposed `HELGRD` (6 alphanumeric). Cannot be added without
   the DLT confirmation checkbox being true.
2. **SendOTP SMS template** — proposed name `heliogrid_otp`, content:
   `##otp## is your HelioGrid verification code. Valid for 5 minutes. Do not share it
   with anyone.` Requires a sender ID + (for India) the DLT-approved template ID.

## Dev mode meanwhile (zero code change at flip-on — the OtpPort seam)

The auth module's `OtpPort` has two adapters selected by env:
- `Msg91OtpAdapter` — real sends via authkey + `MSG91_OTP_TEMPLATE_ID`.
- `DevLogOtpAdapter` — active while `MSG91_OTP_TEMPLATE_ID=PENDING_DLT`: writes the OTP
  to structured logs (exactly the S1 spike pattern). Full auth flow works end-to-end in
  dev/CI without a single SMS.

## DLT flip-on playbook (owner: file DLT registration NOW — 1–2 weeks lead)

1. Register Principal Entity on a DLT portal (Jio/Airtel/VI/BSNL TrueConnect etc.) with
   GSTIN/PAN; register MSG91 as your TM (Help doc: MSG91 → OTP → Templates → Add Sender
   ID → "PE-TM DLT Registration Help Doc").
2. Register header `HELGRD` (or chosen brand header) on DLT → then add it as Sender ID
   in MSG91 (the checkbox becomes honestly checkable).
3. Register the OTP template text on DLT (transactional/OTP category) → get DLT template
   ID → create `heliogrid_otp` in MSG91 with that DLT ID → copy MSG91 template ID.
4. Set `MSG91_OTP_TEMPLATE_ID=<real id>` in env — the adapter switch flips to real SMS.
   No code change.
5. Optional resilience per docs/03 §10: WhatsApp-OTP fallback channel (WABA approval
   flow, outside DLT scope) — evaluate after SMS is live.
