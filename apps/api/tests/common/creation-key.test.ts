import { randomUUID } from 'node:crypto';
import { IDEMPOTENCY_KEY_HEADER, IDEMPOTENCY_KEY_REUSED } from '@heliogrid/contracts';
import { describe, expect, it, vi } from 'vitest';
import {
  type CreationKey,
  CreationReplies,
  creationKeyOf,
  replayOf,
} from '../../src/common/creation-key';

/**
 * The retry key's two decisions (`F4-07`): which request a key answers — the fingerprint binds
 * the actor, the route and the body, so any one of them changed is another request — and what a
 * row an earlier send made means for this send. The lock and the lookup are proven on the wire,
 * in each create route's own suite.
 */

const ROUTE = { method: 'POST', path: '/settings/tranche-templates' };
const OTHER_ROUTE = { method: 'POST', path: '/invitations' };
const BODY = { name: { en: 'Half and half' }, lines: [] };
const key = randomUUID();

const keyOf = (overrides: {
  actor?: string;
  route?: typeof ROUTE;
  body?: unknown;
}): CreationKey | null =>
  creationKeyOf(
    { [IDEMPOTENCY_KEY_HEADER]: key },
    overrides.actor ?? 'actor-a',
    overrides.route ?? ROUTE,
    overrides.body ?? BODY,
  );

describe('which request a retry key answers (F4-07)', () => {
  it('is none when the send carried no key — an app that has not updated', () => {
    expect(creationKeyOf({}, 'actor-a', ROUTE, BODY)).toBeNull();
  });

  it('answers the same request again with the same fingerprint', () => {
    expect(keyOf({})).toEqual(keyOf({}));
  });

  it.each([
    { changed: 'the actor', overrides: { actor: 'actor-b' } },
    { changed: 'the route', overrides: { route: OTHER_ROUTE } },
    { changed: 'the body', overrides: { body: { ...BODY, name: { en: 'Thirds' } } } },
  ])('is another request when $changed changes', ({ overrides }) => {
    const first = keyOf({});
    const second = keyOf(overrides);
    expect(second?.key).toBe(first?.key);
    expect(second?.fingerprint).not.toBe(first?.fingerprint);
  });
});

describe('what an earlier row means for this send (F4-07)', () => {
  const sent = keyOf({}) as CreationKey;

  it.each([
    { stored: sent.fingerprint, outcome: 'replayed' },
    { stored: `${sent.fingerprint}0`, outcome: 'key-reused' },
    { stored: null, outcome: 'key-reused' },
  ])('reads a row stored with $stored as $outcome', ({ stored, outcome }) => {
    expect(replayOf({ id: 'made' }, stored, sent).outcome).toBe(outcome);
  });
});

describe('the answer a keyed create gives', () => {
  const logger = { info: vi.fn(), setContext: vi.fn() };
  const replies = new CreationReplies(logger as never);

  it('answers a created row and logs nothing', () => {
    logger.info.mockClear();
    expect(replies.rowOf({ outcome: 'created', row: 'made' }, ROUTE, 'tenant-1')).toBe('made');
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('answers a replay with the earlier row and logs the route and the tenant, never the body', () => {
    logger.info.mockClear();
    expect(replies.rowOf({ outcome: 'replayed', row: 'made' }, ROUTE, 'tenant-1')).toBe('made');
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      { route: 'POST /settings/tranche-templates', tenantId: 'tenant-1' },
      'a create replayed',
    );
  });

  it('refuses a reused key as the 422 the create routes declare', () => {
    expect(() => replies.rowOf({ outcome: 'key-reused' }, ROUTE, 'tenant-1')).toThrow(
      expect.objectContaining({ code: IDEMPOTENCY_KEY_REUSED, status: 422 }),
    );
  });
});
