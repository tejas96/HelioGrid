# @heliogrid/web — Next.js App Router, pure frontend/BFF (NO domain logic)

## What lives here / what must never live here
- Screens, the /design token reference, route handlers ONLY for cookie/session BFF glue.
- Everything domain-shaped calls apps/api through the ts-rest client. NEVER: business
  logic, direct packages/db imports (dependency-cruiser blocks), raw hex/px values.

## Commands
pnpm --filter @heliogrid/web dev      # localhost:3000 (tokens must be built first: turbo handles it)
pnpm --filter @heliogrid/web build | typecheck

## Depends on / depended on by
uses: @heliogrid/tokens, @heliogrid/contracts        used by: nobody

## Local conventions
- Styling: tokens.css custom properties via Tailwind v4 `@theme inline` mapping in
  app/globals.css. The scaffold `.hg-*` primitives are placeholders — packages/ui's
  21-component set replaces them; never grow them into a parallel component system.
- /design renders dist/tokens.json — a token that doesn't render there doesn't exist.
- Light-only v1 (ruling A); semantic aliases are the future dark drop-in point.

## Landmines
- Import order in layout.tsx matters: tokens.css → base.css → globals.css (base consumes
  token vars; Tailwind maps them last).
- Geist woff2 urls resolve relative to tokens.css inside the tokens package — Next
  bundles them automatically; do not copy fonts into /public.

## Definition of done here
Screen meets the full DoD (docs/10 §10): 375/1536, four states, keyboard+focus ring,
axe clean, ≥44px targets, light correct, Hindi render, provenance on numbers, realistic
volume, wired into a flow. Verified in the running browser, not by build output.
