import { z } from 'zod';
import { originSchema } from './fragments';

/**
 * Browser-visible configuration ONLY. Every value here is shipped to the client and is public
 * by construction — a secret in this schema is a leaked secret, which is why nothing from
 * `secretSchema` may appear.
 *
 * The default lives HERE, not behind a `??` at the call site. That was the defect in the old
 * apps/web/lib/env.ts: the real default was invisible to .env.example and to anyone reading
 * the schema, and a second call site could pick a different one.
 *
 * The web dev-server PORT is not here: `next dev`/`next start` take it only as a `--port` CLI
 * flag (Next has no env-var equivalent), so it is a literal in apps/web/package.json, same as
 * almost every Next app — not a value this schema could actually drive.
 */
export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: originSchema.default('http://localhost:8084'),
});

export type WebEnv = z.infer<typeof webEnvSchema>;
