import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateOpenApi } from '@ts-rest/open-api';
import { apiContract } from '../index';

/**
 * Emits openapi/openapi.json from the root contract — run in CI after build; the
 * artifact is the reviewable public surface (customer links, webhooks, future public API).
 *
 * LIMIT, and it is load-bearing for `pnpm check:openapi`: `@ts-rest/open-api` drops
 * `.refine()`, `.superRefine()` and `.transform()`. A contract change that materially narrows
 * what the API accepts through one of those produces a BYTE-IDENTICAL spec — so the freshness
 * comparison sees no change and oasdiff has no diff to judge. `percentSchema` in common.ts is
 * exactly this shape today (`.regex(...)` plus a `.refine(v => Number(v) <= 100)`).
 *
 * Therefore: for anything that governs the wire, prefer Zod the generator can EXPRESS —
 * `.max()`, `.min()`, `.lte()`, `.regex()` — over `.refine()`. A `.refine()` is a contract
 * change no spec diff can show, so it needs a human callout in the PR instead.
 */
const doc = generateOpenApi(apiContract, {
  info: {
    title: 'HelioGrid API',
    version: '0.0.1',
    description:
      'Contract-first surface. Errors follow the canonical envelope { error: { code, message, details?, requestId } }.',
  },
});

const outDir = join(__dirname, '..', '..', 'openapi');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'openapi.json'), `${JSON.stringify(doc, null, 2)}\n`);
console.log(`openapi/openapi.json emitted (${Object.keys(doc.paths).length} paths)`);
