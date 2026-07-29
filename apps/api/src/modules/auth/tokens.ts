/** DI tokens for the auth module (constructor injection only — apps/api/CLAUDE.md). */

/**
 * The Better Auth instance. The DB pool tokens are NOT here any more — they are platform
 * concerns living in `common/db/`, so the second module to need Postgres cannot open a
 * third pool, and the elevated pool stays behind its own fenced file.
 */
export const AUTH = Symbol('BETTER_AUTH');
