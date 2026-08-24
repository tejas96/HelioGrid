# Spike S3 — ts-rest × Zod 4 status

**Date:** 2026-07-25 · **Verdict: PIN STANDS — Zod-4 support is still a stalled RC. No action.**

## Findings (registry-verified)

| Package | latest stable | rc tag |
|---|---|---|
| @ts-rest/core / nest / open-api | **3.52.1** | 3.53.0-rc.1 |
| zod | 4.4.3 (`latest`); newest 3.x = **3.25.76** | — |

- There is **no stable 3.53.0** on the registry. The ts-rest changelog confirms Zod 4 /
  Standard Schema support exists only in `3.53.0-rc.1`.
- Publish timeline: 3.52.1 (2025-03-04) → 3.53.0-rc.0 (2025-06-01) → rc.1 (2025-06-02) →
  **nothing since — the RC has sat unchanged ~13 months**. This is a stalled RC, not an
  imminent release.
- Peer-dep mechanics: `@ts-rest/core@3.52.1` declares `peerDependencies: { zod: "^3.22.3" }`
  (Zod 4 cannot satisfy it); the RC drops the zod peer entirely (Standard Schema interface).

## Decision

- **Pinned in the scaffold:** `zod@3.25.76` + `@ts-rest/{core,nest,open-api}@3.52.1`
  (lockstep). Biome `noRestrictedImports` bans `zod/v4` / `zod/v4-mini` subpaths.
- Migration window (informational, NOT for the 20-day build): if 3.53 ever ships stable —
  bump all three @ts-rest packages together, move schemas to Zod 4, re-verify
  `@ts-rest/open-api` (it introspects Zod internals that changed in v4), full contract-diff
  review. Only do this if the pinned combo actually breaks; it has not.

## Sources
npm registry (`npm view … versions/dist-tags/time`, queried 2026-07-25) ·
https://ts-rest.com/changelog · https://github.com/ts-rest/ts-rest/releases
