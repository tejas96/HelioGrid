import { z } from 'zod';
import { adminDatabaseUrlSchema, databaseUrlSchema } from './fragments';

/**
 * What the invariants runner reads. Both URLs are optional because the runner is allowed to
 * SKIP locally when no database is configured — but it must fail closed under CI, and that
 * decision belongs to the runner, not to this schema.
 *
 * CI is the bare presence flag every provider sets; it is deliberately not coerced to boolean
 * here, so an empty string stays falsy exactly as the shell meant it.
 */
export const invariantsEnvSchema = z.object({
  DATABASE_URL: databaseUrlSchema.optional(),
  DATABASE_ADMIN_URL: adminDatabaseUrlSchema,
  CI: z.string().optional(),
});

export type InvariantsEnv = z.infer<typeof invariantsEnvSchema>;
