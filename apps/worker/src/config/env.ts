import { type Env, envSchema } from './env.schema';

/**
 * THE ONLY `process.env` READ IN apps/worker (CLAUDE.md §Process; biome `noProcessEnv`
 * enforces it, with this file on the allow-list). Parsed once at load, frozen; bad config
 * is a boot failure naming every offending key, not a mid-job surprise.
 */
function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (parsed.success) return Object.freeze(parsed.data);

  const problems = parsed.error.issues
    .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  // console, not the Nest logger: this runs before the DI container exists.
  console.error(`Invalid environment for apps/worker — fix these and restart:\n${problems}`);
  process.exit(1);
}

export const ENV = loadEnv();
