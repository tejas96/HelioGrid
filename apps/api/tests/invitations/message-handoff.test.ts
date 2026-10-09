import { randomUUID } from 'node:crypto';
import {
  type CreateInvitation,
  IDEMPOTENCY_KEY_HEADER,
  type Invitation,
  type InvitationLanding,
  MESSAGE_DELIVERY,
  type MessageDelivery,
  type SessionProjection,
} from '@heliogrid/contracts';
import { inviteMessageWorkflow } from '@heliogrid/contracts/workflows';
import { invitation, orchestrationOutbox, uuidv7 } from '@heliogrid/db';
import { ROLE_PRESETS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from 'vitest';
import { hashSecret } from '../../src/common/auth/secrets';
import {
  InvitationMessageService,
  inviteLinkSecret,
} from '../../src/modules/invitation/invitation.message.service';
import { InvitationRepository } from '../../src/modules/invitation/invitation.repository';
import { aPhone, openPools } from '../support/fixture';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

/**
 * The invite's text leaves AFTER the commit (`T-FPLAT-085` AC-1, `F4-07`): the send stores the
 * invite with one outbox event naming only ids and sends nothing itself; the worker's run, keyed
 * by the invitation id, calls the api's step, which texts a link made again from that id — and
 * only for an invite the store still holds as pending. Temporal is not reachable in these runs, so
 * the step is called as the run calls it; the dispatch is `outbox-handoff.test.ts`'s proof.
 */

const skip = skipWithoutHarness(
  'INVITE MESSAGE HANDOFF PROOF',
  'That an invite is texted only after its commit, once, is UNPROVEN in this run.',
);

const [ROLE] = ROLE_PRESETS;
const LINK = /\/invite\/([A-Za-z0-9_-]{43})/;
/** The ending the development rail refuses, as a network confirms a hard failure. */
const REFUSED_ENDING = '0000';

describe.skipIf(skip)('the invite text, handed to the outbox (F4-07)', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let here: SessionProjection;
  let tenantId: string;
  let texts: MockInstance<MessageDelivery['send']>;

  const invite = (inviteeName: string): CreateInvitation => ({
    inviteeName,
    phoneE164: aPhone(),
    roles: ROLE === undefined ? [] : [ROLE],
  });
  const send = (body: CreateInvitation, key = randomUUID()) =>
    http.call<Invitation>('POST', '/invitations', body, { [IDEMPOTENCY_KEY_HEADER]: key });
  const runStep = (invitationId: string) =>
    http.app.get(InvitationMessageService).send({ tenantId, invitationId }, Date.now());

  beforeAll(async () => {
    pools = openPools();
    http = await bootHttp();
    await http.signIn();
    here = await http.createCompany('Invite Text EPC');
    tenantId = here.membership?.tenantId ?? '';
    // Recorded, then delivered as ever: the development rail still writes its log line.
    texts = vi.spyOn(http.app.get<symbol, MessageDelivery>(MESSAGE_DELIVERY), 'send');
  });

  afterEach(() => texts.mockClear());

  // The company stays standing (`apps/api/tests/notifications/preferences.test.ts`).
  afterAll(async () => {
    texts.mockRestore();
    await http.close();
    await pools.close();
  });

  it('stores the invite with ONE event naming only ids, keyed to the invitation, and texts nothing inside the request', async () => {
    const sent = await send(invite('Texted Later'));
    expect(sent.status).toBe(HttpStatus.CREATED);
    expect(texts).not.toHaveBeenCalled();
    const [event, ...more] = await eventsFor(sent.body.id);
    expect(more).toEqual([]);
    expect(event?.payload).toEqual({ eventId: event?.id, tenantId, invitationId: sent.body.id });
    expect(
      inviteMessageWorkflow.workflowId(inviteMessageWorkflow.input.parse(event?.payload)),
    ).toBe(`invite-message-${sent.body.id}`);
  });

  it('writes no second event for the same send retried with its key', async () => {
    const key = randomUUID();
    const body = invite('Retried Text');
    const first = await send(body, key);
    const second = await send(body, key);
    expect(second.body.id).toBe(first.body.id);
    expect(await eventsFor(first.body.id)).toHaveLength(1);
    expect(texts).not.toHaveBeenCalled();
  });

  it('texts the stored invite once per run — a step retried texts the same link — and the link lands on that invite', async () => {
    const body = invite('Link Lands');
    const sent = await send(body);
    expect(await runStep(sent.body.id)).toEqual({ sent: true });
    expect(texts).toHaveBeenCalledTimes(1);
    expect(await runStep(sent.body.id)).toEqual({ sent: true });
    expect(texts).toHaveBeenCalledTimes(2);
    const tokens = texts.mock.calls.map(([text]) => LINK.exec(text.message)?.[1]);
    expect(tokens).toEqual([inviteLinkSecret(sent.body.id), inviteLinkSecret(sent.body.id)]);
    expect(texts.mock.calls[0]?.[0]).toMatchObject({ phoneE164: body.phoneE164, channel: 'sms' });
    const token = tokens[0] ?? '';
    const landing = await http.callAnonymously<InvitationLanding>(
      'GET',
      `/invitations/landing/${token}`,
    );
    expect(landing.status).toBe(HttpStatus.OK);
    expect(landing.body).toMatchObject({ phoneE164: body.phoneE164, status: 'pending' });
  });

  it('stores nothing and so texts nothing when the send’s transaction fails after the invite is written', async () => {
    const earlier = await send(invite('Event Owner'));
    const [taken] = await eventsFor(earlier.body.id);
    const id = uuidv7();
    // The handoff is the transaction's last write; an event id already taken fails it there, so
    // the invite, its roles and its entry are all written before the rollback.
    await expect(
      http.app
        .get(InvitationRepository)
        .create(
          tenantId,
          { id, ...invite('Never Stored'), tokenHash: hashSecret(inviteLinkSecret(id)) },
          { actorUserId: here.actor.userId, now: Date.now() },
          null,
          taken?.id ?? '',
        ),
    ).rejects.toThrow();
    expect(await storedInvite(id)).toBe(false);
    expect(await eventsFor(id)).toEqual([]);
    expect(await runStep(id)).toEqual({ sent: false });
    expect(texts).not.toHaveBeenCalled();
  });

  it('fails a refused text for its run to retry, naming the invite but never the phone — the error is written to Temporal history and the worker log', async () => {
    const refusedPhone = `${aPhone().slice(0, -REFUSED_ENDING.length)}${REFUSED_ENDING}`;
    const body = { ...invite('Refused Number'), phoneE164: refusedPhone };
    const sent = await send(body);
    expect(sent.status).toBe(HttpStatus.CREATED);
    const refused = await runStep(sent.body.id).catch((error: unknown) => error);
    expect(texts).toHaveBeenCalledTimes(1);
    expect(refused).toBeInstanceOf(Error);
    expect(String((refused as Error).message)).not.toContain(body.phoneE164.slice(1));
    expect(JSON.stringify(refused, Object.getOwnPropertyNames(refused))).not.toContain(
      body.phoneE164.slice(1),
    );
  });

  it('texts nothing for an invite withdrawn before its run', async () => {
    const sent = await send(invite('Withdrawn First'));
    const revoked = await http.call('POST', `/invitations/${sent.body.id}/revoke`);
    expect(revoked.status).toBe(HttpStatus.OK);
    expect(await runStep(sent.body.id)).toEqual({ sent: false });
    expect(texts).not.toHaveBeenCalled();
  });

  function eventsFor(invitationId: string) {
    return pools.admin.db
      .select({ id: orchestrationOutbox.id, payload: orchestrationOutbox.payload })
      .from(orchestrationOutbox)
      .where(
        and(
          eq(orchestrationOutbox.workflow, inviteMessageWorkflow.name),
          sql`${orchestrationOutbox.payload}->>'invitationId' = ${invitationId}`,
        ),
      );
  }

  async function storedInvite(id: string): Promise<boolean> {
    const rows = await pools.admin.db
      .select({ id: invitation.id })
      .from(invitation)
      .where(eq(invitation.id, id));
    return rows.length > 0;
  }
});
