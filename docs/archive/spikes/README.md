# Week-1 verification spikes — verdicts (docs/14 Day 1–2)

| Spike | Verdict | Note |
|---|---|---|
| S1 Better Auth phone-OTP (bare-RN pattern) | **WORKS WITH CAVEATS** — flow proven hands-on; traps documented | [S1](./S1-better-auth-phone-otp.md) |
| S2 pgBackRest → Tigris + restore drill | **BLOCKED-ON-OWNER** (billable infra deferred) | [S2](./S2-pgbackrest-tigris-restore.md) |
| S3 ts-rest / Zod-4 status | **PIN STANDS** — 3.53 still a stalled RC | [S3](./S3-ts-rest-zod4-status.md) |
| S4 Tigris `sin` pin | **BLOCKED-ON-OWNER** (billable infra deferred) | [S4](./S4-tigris-sin-pin.md) |
| S5 Exotel BYO + DTMF | **MATERIAL FINDINGS** — BYO=forwarding-only; no DTMF-send; 140-series needed. Owner review required | [S5](./S5-exotel-byo-dtmf.md) |
| S6 PowerSync self-host smoke | **PASS** (local; Fly leg pending owner infra) | [S6](./S6-powersync-selfhost-smoke.md) |

Blocked spikes carry ready-to-run command sequences — they execute the day the owner
provisions Fly billing (S2/S4) or the Exotel account lands (S5's hands-on leg).
