import { type SQL, sql } from 'drizzle-orm';
import type { CreationKey } from '../creation-key';

/**
 * Taken FIRST in the create's transaction, before the lookup: a second send of the same key waits
 * here until the first commits, then finds its row — so two sends never both pass the lookup and
 * insert. The partial unique index on the key is the backstop, not the mechanism.
 */
export async function lockCreationKey(
  tx: { execute(query: SQL): PromiseLike<unknown> },
  key: CreationKey,
): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`creation:${key.key}`}))`);
}
