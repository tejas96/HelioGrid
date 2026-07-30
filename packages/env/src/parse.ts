import type { z } from 'zod';

/**
 * The single validation path. Every entry point reads its raw source and hands it here;
 * nothing else in the repo parses environment values.
 *
 * It THROWS rather than calling process.exit. A library that exits kills its host and cannot
 * be exercised; deciding what a failure means belongs to the entry point. The server entries
 * catch this and exit(1) with the message, because a misconfigured service should not boot.
 *
 * Failure is fatal and LOUD, naming every bad key at once: a missing DATABASE_URL used to
 * coerce to '' and surface as a query error later.
 */
export function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  source: Record<string, string | undefined>,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (result.success) return result.data;

  const detail = result.error.issues
    .map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  throw new Error(
    `Invalid environment for ${label}:\n${detail}\n\n` +
      'Every variable is declared in packages/env/src/schema/ and documented in .env.example. ' +
      'Secrets never have defaults — an absent value must stop startup.',
  );
}
