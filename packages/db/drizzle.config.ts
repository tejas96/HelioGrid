import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit is used to DRAFT migration SQL from schema changes (`drizzle-kit generate`
 * writes into ./drizzle-draft — review, adapt, then move the reviewed SQL into
 * ./migrations as the next numbered file). The applied history lives in ./migrations
 * and is append-only; drizzle-kit never applies anything directly.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle-draft',
});
