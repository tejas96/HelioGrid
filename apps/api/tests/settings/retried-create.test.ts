import { randomUUID } from 'node:crypto';
import {
  IDEMPOTENCY_KEY_HEADER,
  type SessionProjection,
  type TrancheTemplate,
  type TrancheTemplateWrite,
} from '@heliogrid/contracts';
import { auditLogEntry, trancheTemplate } from '@heliogrid/db';
import { HttpStatus } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openPools } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

/**
 * A payment template added twice is ONE template (`F4-07`), on the wire against a migrated
 * database: the retry key, the lock that serialises two sends of it, the refusal of a key reused
 * for another request, and the archive repeated as a retry. The key's decisions are proven pure
 * in `apps/api/tests/common/creation-key.test.ts`; what only a real transaction shows is here.
 */

const skip = skipWithoutHarness(
  'RETRIED CREATE WIRE PROOF',
  'A retried payment-template create is UNPROVEN on the wire in this run.',
);

const PATH = '/settings/tranche-templates';

const template = (name: string): TrancheTemplateWrite => ({
  name: { en: name },
  lines: [
    { label: { en: 'Booking' }, percent: '40.00', dueOnStage: 'won' },
    { label: { en: 'Done' }, percent: '60.00', dueOnStage: 'commissioned' },
  ],
});

describe.skipIf(skip)('a retried payment-template create, over HTTP (F4-07)', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let here: SessionProjection;
  let tenantId: string;

  const add = (body: TrancheTemplateWrite, key?: string) =>
    http.call<TrancheTemplate>(
      'POST',
      PATH,
      body,
      key === undefined ? {} : { [IDEMPOTENCY_KEY_HEADER]: key },
    );

  beforeAll(async () => {
    pools = openPools();
    http = await bootHttp();
    await http.signIn();
    here = await http.createCompany('Retried Templates EPC');
    tenantId = here.membership?.tenantId ?? '';
  });

  // The company stays standing: every HTTP suite shares one development number, and deleting a
  // tenant races another suite's sign-in (`apps/api/tests/notifications/preferences.test.ts`).
  afterAll(async () => {
    await http.close();
    await pools.close();
  });

  it('answers the same key twice with ONE template, the same record and one entry', async () => {
    const key = randomUUID();
    const first = await add(template('Twice sent'), key);
    const second = await add(template('Twice sent'), key);
    expect([first.status, second.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(second.body.id).toBe(first.body.id);
    expect(await rowsWithKey(key)).toBe(1);
    expect(await createdEntriesFor(first.body.id)).toBe(1);
  });

  it('answers two sends of one key AT ONCE with one template — the second waits on the first', async () => {
    const key = randomUUID();
    // Both sends need the tenant lock to insert; held, it makes them overlap for certain. Without
    // the key lock both pass the lookup, queue here, and the second insert breaks the unique key.
    const held = await holdLock(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);
    const sends = Promise.all([
      add(template('Sent at once'), key),
      add(template('Sent at once'), key),
    ]);
    await held.waitForWaiters(2);
    await held.release();
    const [one, two] = await sends;
    expect([one.status, two.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(two.body.id).toBe(one.body.id);
    expect(await rowsWithKey(key)).toBe(1);
  });

  it('refuses the same key with a different body as IDEMPOTENCY_KEY_REUSED, writing nothing', async () => {
    const key = randomUUID();
    await add(template('First body'), key);
    const reused = await add(template('Second body'), key);
    expect(reused.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reused.body).toMatchObject({ error: { code: 'IDEMPOTENCY_KEY_REUSED' } });
    expect(await rowsNamed('Second body')).toBe(0);
  });

  it('applies a send with no key as before — an app that has not updated makes two', async () => {
    await add(template('No key'));
    await add(template('No key'));
    expect(await rowsNamed('No key')).toBe(2);
  });

  it('refuses uneven lines before any transaction opens, so the same key creates once they are whole', async () => {
    const key = randomUUID();
    const uneven = { ...template('Refused first'), lines: template('x').lines.slice(0, 1) };
    expect((await add(uneven, key)).status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(await rowsWithKey(key)).toBe(0);
    expect((await add(template('Refused first'), key)).status).toBe(HttpStatus.CREATED);
    expect(await rowsWithKey(key)).toBe(1);
  });

  it('replays the template as it stands now — an edit made after the create shows', async () => {
    const key = randomUUID();
    const made = await add(template('Before the edit'), key);
    const saved = await http.call('PUT', `${PATH}/${made.body.id}`, template('After the edit'));
    expect(saved.status).toBe(HttpStatus.OK);
    const replay = await add(template('Before the edit'), key);
    expect(replay.status).toBe(HttpStatus.CREATED);
    expect(replay.body).toMatchObject({ id: made.body.id, name: { en: 'After the edit' } });
  });

  it.each([{ key: 'not-a-uuid' }, { key: '' }])(
    'refuses a malformed key "$key" before anything is written',
    async ({ key }) => {
      const refused = await add(template(`Malformed ${key}`), key);
      expect(refused.status).toBe(HttpStatus.BAD_REQUEST);
      expect(await rowsNamed(`Malformed ${key}`)).toBe(0);
    },
  );

  it('answers two archives AT ONCE with the template, and records the act once', async () => {
    const made = await add(template('Archived at once'), randomUUID());
    // A row lock both archives' updates would queue on: without the tenant lock taken BEFORE the
    // standing is read, both read "live" here and both record the act.
    const held = await holdLock(
      sql`select id from tranche_template where id = ${made.body.id} for update`,
    );
    const archive = () => http.call<TrancheTemplate>('POST', `${PATH}/${made.body.id}/archive`);
    const both = Promise.all([archive(), archive()]);
    await held.waitForWaiters(2);
    await held.release();
    const [first, second] = await both;
    expect([first.status, second.status]).toEqual([HttpStatus.OK, HttpStatus.OK]);
    expect(await entriesFor(made.body.id, 'settings.tranche_template_archived')).toBe(1);
  });

  it('answers an archive repeated — the retry — with the template, and records it once', async () => {
    const made = await add(template('Archived twice'), randomUUID());
    const archive = () => http.call<TrancheTemplate>('POST', `${PATH}/${made.body.id}/archive`);
    const first = await archive();
    const second = await archive();
    expect([first.status, second.status]).toEqual([HttpStatus.OK, HttpStatus.OK]);
    expect(second.body).toMatchObject({ id: made.body.id, archived: true });
    expect(await entriesFor(made.body.id, 'settings.tranche_template_archived')).toBe(1);
  });

  async function rowsWithKey(key: string): Promise<number> {
    const rows = await pools.admin.db
      .select({ id: trancheTemplate.id })
      .from(trancheTemplate)
      .where(and(eq(trancheTemplate.tenantId, tenantId), eq(trancheTemplate.creationKey, key)));
    return rows.length;
  }

  async function rowsNamed(name: string): Promise<number> {
    const rows = await pools.admin.db
      .select({ name: trancheTemplate.name })
      .from(trancheTemplate)
      .where(eq(trancheTemplate.tenantId, tenantId));
    return rows.filter((row) => row.name.en === name).length;
  }

  function createdEntriesFor(id: string): Promise<number> {
    return entriesFor(id, 'settings.tranche_template_created');
  }

  async function entriesFor(
    id: string,
    eventType: 'settings.tranche_template_created' | 'settings.tranche_template_archived',
  ): Promise<number> {
    const rows = await pools.admin.db
      .select({ id: auditLogEntry.id })
      .from(auditLogEntry)
      .where(
        and(
          eq(auditLogEntry.tenantId, tenantId),
          eq(auditLogEntry.eventType, eventType),
          eq(auditLogEntry.subjectRef, id),
        ),
      );
    return rows.length;
  }
});
