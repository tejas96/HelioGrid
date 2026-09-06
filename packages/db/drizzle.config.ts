import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit is used to DRAFT migration SQL from schema changes (`drizzle-kit generate`
 * writes into ./drizzle-draft — review, adapt, then move the reviewed SQL into
 * ./migrations as the next numbered file). The applied history lives in ./migrations
 * and is append-only; drizzle-kit never applies anything directly.
 *
 * `./src/schema/` does not exist right now: the greenfield reset
 * deleted it, and the auth + tenancy module re-authors it with its first migration. This
 * config is left pointing where the schema WILL be, so the path is correct the moment the
 * rebuild lands rather than being rediscovered then.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle-draft',
});
