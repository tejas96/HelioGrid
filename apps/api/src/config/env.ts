import { type Env, envSchema } from './env.schema';

/**
 * THE ONLY `process.env` READ IN apps/api (CLAUDE.md §Process; biome `noProcessEnv`
 * enforces it, with this file on the allow-list).
 *
 * Parsed once at module load and frozen, so misconfiguration is a boot failure that names
 * every bad key at once — not a 500 on the first request that happens to touch the var.
 */
function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (parsed.success) return Object.freeze(parsed.data);

  const problems = parsed.error.issues
    .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  // console, not the Nest logger: this runs before the DI container exists.
  console.error(`Invalid environment for apps/api — fix these and restart:\n${problems}`);
  process.exit(1);
}

export const ENV = loadEnv();
