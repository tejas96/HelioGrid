import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateOpenApi } from '@ts-rest/open-api';
import { apiContract } from '../index';

/**
 * Emits openapi/openapi.json from the root contract — run in CI after build; the
 * artifact is the reviewable public surface (customer links, webhooks, future public API).
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
