import { randomUUID } from 'node:crypto';
import {
  type CreateInvitation,
  IDEMPOTENCY_KEY_HEADER,
  type Invitation,
  invitationContract,
  type SessionProjection,
} from '@heliogrid/contracts';
import { auditLogEntry, invitation } from '@heliogrid/db';
import { ROLE_PRESETS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creationKeyOf } from '../../src/common/creation-key';
import { InvitationRepository } from '../../src/modules/invitation/invitation.repository';
import { aPhone, openPools } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

/**
 * An invite sent twice is ONE invite and ONE message (`F4-07`), on the wire against a migrated
 * database. The replay is answered BEFORE the send's checks — which would otherwise call the
 * first invite "already invited" — and before the message, which leaves inside the transaction.
 * A revoke repeated is the retry of a revoke and answers the invite; a revoke of an invite the
 * person already answered stays a conflict, because it is not the same act.
 */

const skip = skipWithoutHarness(
  'RETRIED INVITE WIRE PROOF',
  'A retried invite send is UNPROVEN on the wire in this run.',
);

const [ROLE] = ROLE_PRESETS;

describe.skipIf(skip)('a retried invite send, over HTTP (F4-07)', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let here: SessionProjection;
  let tenantId: string;

  const invite = (inviteeName: string): CreateInvitation => ({
    inviteeName,
    phoneE164: aPhone(),
    roles: ROLE === undefined ? [] : [ROLE],
  });
  const send = (body: CreateInvitation, key: string) =>
    http.call<Invitation>('POST', '/invitations', body, { [IDEMPOTENCY_KEY_HEADER]: key });

  beforeAll(async () => {
    pools = openPools();
    http = await bootHttp();
    await http.signIn();
    here = await http.createCompany('Retried Invites EPC');
    tenantId = here.membership?.tenantId ?? '';
  });

  // The company stays standing (`apps/api/tests/notifications/preferences.test.ts`).
  afterAll(async () => {
    await http.close();
    await pools.close();
  });

  it('answers the same key twice with ONE invite and one entry — the message left once', async () => {
    const key = randomUUID();
    const body = invite('Sent Twice');
    const first = await send(body, key);
    const second = await send(body, key);
    expect([first.status, second.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(second.body.id).toBe(first.body.id);
    expect(await invitesTo(body.phoneE164)).toBe(1);
    expect(await entriesFor(first.body.id, 'team.invite_sent')).toBe(1);
  });

  it('answers two sends of one key AT ONCE with ONE invite — the second waits on the first', async () => {
    const key = randomUUID();
    const body = invite('Sent At Once');
    // Both sends need the tenant lock; held, it makes them overlap for certain. Without the key
    // lock both pass the lookup and the second is refused as already invited.
    const held = await holdLock(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);
    const sends = Promise.all([send(body, key), send(body, key)]);
    await held.waitForWaiters(2);
    await held.release();
    const [first, second] = await sends;
    expect([first.status, second.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(second.body.id).toBe(first.body.id);
    expect(await invitesTo(body.phoneE164)).toBe(1);
  });

  it('leaves no key behind a send the carrier refused, so the same key sends again (F4-07)', async () => {
    const key = randomUUID();
    const body = invite('Carrier Refused Once');
    const tenantSide = new InvitationRepository(pools.tenants);
    const act = { actorUserId: here.actor.userId, now: Date.now() };
    const creationKey = creationKeyOf(
      { [IDEMPOTENCY_KEY_HEADER]: key },
      act.actorUserId,
      invitationContract.create,
      body,
    );
    const toSend = { ...body, tokenHash: randomUUID() };
    // The insert, the entry and the key are written, then the carrier refuses and the whole
    // transaction rolls back: the key must go with it, or the retry would replay nothing real.
    await expect(
      tenantSide.create(tenantId, toSend, act, creationKey, async () => {
        throw new Error('carrier refused');
      }),
    ).rejects.toThrow('carrier refused');
    expect(await invitesTo(body.phoneE164)).toBe(0);
    const retried = await tenantSide.create(tenantId, toSend, act, creationKey, async () => {});
    expect(retried.outcome).toBe('created');
    expect(await invitesTo(body.phoneE164)).toBe(1);
  });

  it('refuses the same key with another invitee as IDEMPOTENCY_KEY_REUSED, sending nothing', async () => {
    const key = randomUUID();
    await send(invite('Kept'), key);
    const other = invite('Refused');
    const reused = await send(other, key);
    expect(reused.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reused.body).toMatchObject({ error: { code: 'IDEMPOTENCY_KEY_REUSED' } });
    expect(await invitesTo(other.phoneE164)).toBe(0);
  });

  it('answers a revoke repeated — the retry — with the invite, and records it once', async () => {
    const made = await send(invite('Revoked Twice'), randomUUID());
    const revoke = () => http.call<Invitation>('POST', `/invitations/${made.body.id}/revoke`);
    const first = await revoke();
    const second = await revoke();
    expect([first.status, second.status]).toEqual([HttpStatus.OK, HttpStatus.OK]);
    expect(second.body).toMatchObject({ id: made.body.id, status: 'revoked' });
    expect(await entriesFor(made.body.id, 'team.invite_revoked')).toBe(1);
  });

  async function invitesTo(phoneE164: string): Promise<number> {
    const rows = await pools.admin.db
      .select({ id: invitation.id })
      .from(invitation)
      .where(and(eq(invitation.tenantId, tenantId), eq(invitation.inviteePhoneE164, phoneE164)));
    return rows.length;
  }

  async function entriesFor(
    id: string,
    eventType: 'team.invite_sent' | 'team.invite_revoked',
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
