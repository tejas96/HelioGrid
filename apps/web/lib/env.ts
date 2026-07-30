/**
 * THE ONLY `process.env` READ IN apps/web (CLAUDE.md §Process; biome `noProcessEnv`
 * enforces it, with this file on the allow-list).
 *
 * Next.js inlines `NEXT_PUBLIC_*` at BUILD time, so this cannot be a runtime Zod parse the
 * way the server apps do it — the literal must appear statically for the bundler to
 * substitute it. Keeping the read in one file is still what matters: the fallback lives
 * here, once, instead of at every call site.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
