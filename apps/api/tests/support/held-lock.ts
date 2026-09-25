import { createDb } from '@heliogrid/db';
import { type SQL, sql } from 'drizzle-orm';
import { adminUrl } from './preconditions';

/**
 * Two requests made to overlap on PURPOSE, never by luck. Two sends fired together mostly run one
 * after the other, so a test that hopes they overlap stays green with the lock it means to guard
 * removed. This holds a lock the requests need, in a transaction of its own, until both are seen
 * WAITING — on the held lock, or on each other behind it — and only then lets them go.
 */
export interface HeldLock {
  /** Resolves once `count` sessions wait on the held lock, directly or behind one that does. */
  waitForWaiters(count: number): Promise<void>;
  release(): Promise<void>;
}

const WAIT_CEILING_MS = 10_000;
const POLL_MS = 25;

export async function holdLock(take: SQL): Promise<HeldLock> {
  const holder = createDb(adminUrl, { max: 2 });
  let release = (): void => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let heldPid = 0;
  const held = new Promise<void>((resolve, reject) => {
    holder.db
      .transaction(async (tx) => {
        const [me] = await tx.execute<{ pid: number }>(sql`select pg_backend_pid() as pid`);
        heldPid = me?.pid ?? 0;
        await tx.execute(take);
        resolve();
        await released;
      })
      .catch(reject);
  });
  await held;

  return {
    async waitForWaiters(count) {
      const deadline = Date.now() + WAIT_CEILING_MS;
      while (Date.now() < deadline) {
        const [row] = await holder.db.execute<{ waiting: number }>(sql`
          with direct as (
            select pid from pg_stat_activity where ${heldPid} = any(pg_blocking_pids(pid))
          )
          select (select count(*) from direct)::int + (
            select count(*) from pg_stat_activity a
            where exists (select 1 from direct d where d.pid = any(pg_blocking_pids(a.pid)))
          )::int as waiting`);
        if ((row?.waiting ?? 0) >= count) return;
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      }
      throw new Error(`fewer than ${count} requests waited on the held lock`);
    },
    async release() {
      release();
      await holder.client.end();
    },
  };
}
