import { loadWebEnv } from '@heliogrid/env/web';

/**
 * apps/web's single configuration decision point. The SCHEMA and the VALIDATION live in
 * `@heliogrid/env`; this file supplies the raw value, and that split is required rather than
 * stylistic.
 *
 * `NEXT_PUBLIC_*` inlining is a build-time textual substitution over code NEXT COMPILES.
 * `@heliogrid/env` ships pre-built CJS into node_modules, so Next never transforms it — the
 * read has to be written out literally HERE. Written inside the package instead, it survived
 * into the client bundle verbatim, evaluated to `undefined` in the browser, and silently fell
 * back to the schema default: a production URL would have been ignored with nothing failing.
 *
 * The old `?? 'http://localhost:8080'` is gone: the default now lives in `webEnvSchema`, where
 * `.env.example` and any reader can see it, and a malformed value fails naming the key instead
 * of producing a mystery network error.
 */
export const API_URL = loadWebEnv({
  // One key, written out. Do NOT rewrite as process.env[k] or a spread — neither is substituted.
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
}).NEXT_PUBLIC_API_URL;
