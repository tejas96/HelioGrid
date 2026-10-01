import { describe, expect, it } from 'vitest';
import type { SessionSnapshot, SessionUser } from '../../src/auth/session';
import { CHECKING, canRenew, SIGNED_OUT, sessionAfter } from '../../src/auth/session-transitions';

const TENANT_ID = '8f0c2d1e-0000-4000-8000-000000000001';
const priya: SessionUser = {
  id: '8f0c2d1e-0000-4000-8000-0000000000a1',
  name: 'Priya Kulkarni',
  phoneE164: '+919876543210',
  interfaceLanguage: 'en',
  tenant: { id: TENANT_ID, roles: ['sales_executive'] },
};
const signedIn: SessionSnapshot = sessionAfter(CHECKING, {
  kind: 'signed-in',
  user: priya,
  restored: true,
});
const removed = sessionAfter(signedIn, { kind: 'lost', loss: 'access-removed' });
const removedAtBoot = sessionAfter(CHECKING, { kind: 'lost', loss: 'access-removed' });

describe('sessionAfter — why a session ended, and what the device keeps of it (M01-07, S1.wrong.4)', () => {
  it('holds a signed-in person whose access was removed, with the reason', () => {
    expect(removed).toEqual({ ...signedIn, ended: { tenantId: TENANT_ID } });
    expect(sessionAfter(removed, { kind: 'signed-out' })).toEqual(SIGNED_OUT);
  });

  it('opens the door for every other loss of a signed-in session, with no reason held', () => {
    expect(sessionAfter(signedIn, { kind: 'lost', loss: 'signed-out' })).toEqual(SIGNED_OUT);
  });

  it.each([
    { loss: 'access-removed', ended: { tenantId: null } },
    { loss: 'signed-out', ended: null },
  ] as const)('moves a boot check that finds the session $loss to the door', ({ loss, ended }) => {
    expect(sessionAfter(CHECKING, { kind: 'lost', loss })).toEqual({ ...SIGNED_OUT, ended });
  });

  it('keeps an ending found at boot when the boot check fails after it', () => {
    expect(sessionAfter(removedAtBoot, { kind: 'boot-failed' })).toBe(removedAtBoot);
  });

  it('sends a boot check that failed for any other reason to the door', () => {
    expect(sessionAfter(CHECKING, { kind: 'boot-failed' })).toEqual(SIGNED_OUT);
  });

  it.each([
    {
      from: removed,
      loss: 'signed-out',
      why: 'a signed-out refresh after the removal cleared the cookies',
    },
    { from: removed, loss: 'access-removed', why: 'the same removal twice' },
    { from: removedAtBoot, loss: 'signed-out', why: 'a signed-out loss after one found at boot' },
    { from: SIGNED_OUT, loss: 'access-removed', why: 'a late removal once signed out' },
  ] as const)('answers a loss that changes nothing with the same snapshot', ({ from, loss }) => {
    expect(sessionAfter(from, { kind: 'lost', loss })).toBe(from);
  });

  it.each([
    { from: removed, why: 'after a removal while signed in' },
    { from: removedAtBoot, why: 'after a removal found at boot' },
  ])('clears the ending on a sign-in and on a sign-out', ({ from }) => {
    const back = sessionAfter(from, { kind: 'signed-in', user: priya, restored: false });
    expect(back.ended).toBeNull();
    expect(back.status).toBe('authenticated');
    expect(sessionAfter(from, { kind: 'signed-out' }).ended).toBeNull();
  });
});

describe('canRenew — a refresh is posted only for a session that could still be held', () => {
  it.each([
    {
      snapshot: CHECKING,
      renews: true,
      why: 'the boot check — a lapsed token comes back this way',
    },
    { snapshot: signedIn, renews: true, why: 'signed in' },
    { snapshot: removed, renews: false, why: 'access removed while signed in' },
    { snapshot: removedAtBoot, renews: false, why: 'ended at boot' },
    { snapshot: SIGNED_OUT, renews: false, why: 'signed out' },
  ])('renews only a session that could still be held', ({ snapshot, renews }) => {
    expect(canRenew(snapshot)).toBe(renews);
  });
});
