/**
 * The browser/Next entry. Like ./native and UNLIKE ./server, it takes the raw source as a
 * parameter instead of reading one.
 *
 * That is not symmetry for its own sake — Next.js forces it. `NEXT_PUBLIC_*` inlining is a
 * build-time TEXTUAL substitution applied to code Next COMPILES. This package ships pre-built
 * CJS into node_modules, so Next never transforms it: a `process.env.NEXT_PUBLIC_API_URL`
 * written HERE survives verbatim into the client bundle, evaluates to `undefined` in the
 * browser, and falls through to the schema default — so a production URL would be ignored with
 * no error anywhere. That is exactly what the first version of this file did, and it was only
 * visible by grepping the built chunks.
 *
 * So the literal read lives in `apps/web/lib/env.ts`, inside code Next compiles, and this
 * function owns the schema and the validation. The rule that survives: only the SOURCE of raw
 * values differs per platform — never the schema, never the validator.
 */
import { parseEnv } from './parse';
import { type WebEnv, webEnvSchema } from './schema/web';

let cache: WebEnv | undefined;

export function loadWebEnv(source: Record<string, string | undefined>): WebEnv {
  if (!cache) cache = parseEnv(webEnvSchema, source, 'apps/web');
  return cache;
}

export type { WebEnv } from './schema/web';
