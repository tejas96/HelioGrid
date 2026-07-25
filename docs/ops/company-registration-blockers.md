# Blocked on company registration — single tracking note (2026-07-26)

The company entity (Udyam Aadhaar / Shop Act / GST) is **in progress**. Everything below
waits on it; development does NOT — each row has a dev-mode path and a flip-on playbook,
and credentials get added via the owner's consoles when they exist (the MSG91 pattern:
agent configures in the visible browser, secrets land in `.env.local`/Fly secrets only).

| Blocked item | Needs | Dev-mode meanwhile | Flip-on playbook |
|---|---|---|---|
| Razorpay account + KYC | Business entity, GSTIN, PAN, bank proof | Billing module builds against the webhook contract + entitlement machinery; test keys the day the account exists | [razorpay-setup.md](./razorpay-setup.md) |
| DLT registration (PE + header + templates) | Registered entity + GSTIN | `DevLogOtpAdapter` (OTP → structured logs); full auth flow works in dev/CI | [msg91-setup.md](./msg91-setup.md) |
| Google Play **organization** account | Registered company + D-U-N-S number ($25 fee) | Emulator + APK sideload (`gradlew assembleRelease` for testers) | Create org account → Play internal track → the Day-5-style internal distribution starts then |
| Apple Developer **organization** account | Registered company + D-U-N-S ($99/yr) | Simulator; devices via personal-team free signing if ever needed | Enroll → APNs .p8 upload to Firebase ([firebase-setup.md](./firebase-setup.md)) → TestFlight |
| GST fields on invoices (Razorpay) | GSTIN | Test-mode invoices without GST fields | Set GSTIN/SAC in Razorpay dashboard |
| MSG91 sender ID `HELGRD` + `heliogrid_otp` template | DLT approval | — (covered by DevLogOtpAdapter row) | msg91-setup.md §3 |

**Owner decision 2026-07-26:** personal Play/Apple accounts were considered and declined —
wait for the org accounts (no double fees, no app transfer). Consequence, recorded
honestly against docs/14 Track M: the "TestFlight + Play internal from Day 5" milestone
becomes "internal distribution via sideload/simulator from Day 5; STORE-internal
distribution starts when the org accounts exist." The store-review risk row's mitigation
(code ships in-window, activation follows approval clocks) already covers this pattern.

**Separate (not company-gated):** Fly billing card — owner adds at
fly.io/dashboard/heliogrid/billing, then run [infra/README.md](../../infra/README.md).
