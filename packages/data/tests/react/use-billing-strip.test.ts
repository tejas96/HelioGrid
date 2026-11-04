// @vitest-environment happy-dom
import type { EntitlementBlocked } from '@heliogrid/contracts';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBillingStrip } from '../../src/react/use-billing-strip';
import { CHECKOUT_URL, dueOf, homeOf, PAY_URL, reactivationOf } from './billing-home-fixtures';
import { origin, requestsTo, SALES, wrapperOf } from './billing-origin';

/** What the billing gate says when it refuses a save (`M12-21`). */
const BLOCKED: EntitlementBlocked = {
  reason: 'billing_state',
  capability: 'team_invites',
  phase: 'halted',
  haltsAt: null,
};
const refused = {
  status: 403,
  body: {
    error: {
      code: 'ENTITLEMENT_BLOCKED',
      message: 'This is paused for your company.',
      requestId: 'test',
      blocked: BLOCKED,
    },
  },
};

/** The shell's strip, mounted in the real provider over the origin, once its read has answered. */
async function mountedStrip() {
  const told = { opened: [] as string[], home: 0, plans: 0 };
  const adapter = {
    openExternal: (url: string) => told.opened.push(url),
    toBillingHome: () => {
      told.home += 1;
    },
    toPlans: () => {
      told.plans += 1;
    },
  };
  const view = renderHook(() => useBillingStrip(adapter), { wrapper: wrapperOf() });
  await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
  return Object.assign(view, { told });
}

/**
 * The shell's billing strip and its denial through the real client (`SCR-SHELL-06`): who reads
 * what, where the one act goes, and the refusal every save can meet.
 */
describe('The billing strip, through the real client', () => {
  it('an Owner reads the home and the signals; a member the standing, the signals and the owners', async () => {
    const owner = await mountedStrip();
    expect(owner.result.current.read).toMatchObject({
      kind: 'ready',
      value: { audience: 'owner' },
    });
    expect(requestsTo('/billing/home')).toHaveLength(1);
    expect(requestsTo('/billing/standing')).toHaveLength(0);
    expect(requestsTo('/billing/usage/signals')).toHaveLength(1);
    owner.unmount();
    origin.requests = [];

    origin.roles = [SALES];
    const member = await mountedStrip();
    await waitFor(() =>
      expect(member.result.current.read).toMatchObject({
        kind: 'ready',
        value: { audience: 'member', home: null, owners: { owners: [{ name: 'Rajesh Sharma' }] } },
      }),
    );
    expect(requestsTo('/billing/standing')).toHaveLength(1);
    expect(requestsTo('/billing/home')).toHaveLength(0);
  });

  it('days 4–6: the act opens the failed charge’s pay page; with none, Billing Home', async () => {
    origin.home = homeOf('past_due', { due: dueOf() });
    const view = await mountedStrip();
    act(() => view.result.current.act('pay_link'));
    await waitFor(() => expect(view.told.opened).toEqual([PAY_URL]));
    act(() => view.result.current.act('billing_home'));
    await waitFor(() => expect(view.told.home).toBe(1));
  });

  it('a refused save keeps its blocked details and still rejects', async () => {
    origin.home = homeOf('halted', { reactivation: reactivationOf() });
    origin.acts.checkout = [refused];
    const view = await mountedStrip();
    act(() => view.result.current.act('reactivate'));
    await waitFor(() => expect(view.result.current.refusal?.blocked).toEqual(BLOCKED));
    // It still rejects — nothing opens — and the denial, not a second line, says why.
    expect(view.result.current.acting).toBe(false);
    expect(view.result.current.failed).toBe(false);
    expect(view.told.opened).toEqual([]);
    // The strip reads its state again, since the refusal may mean it moved.
    await waitFor(() => expect(requestsTo('/billing/home').length).toBeGreaterThan(1));
    act(() => view.result.current.dismissRefusal());
    expect(view.result.current.refusal).toBeNull();
  });

  it('a second press while the act is out sends nothing', async () => {
    origin.home = homeOf('halted', { reactivation: reactivationOf() });
    origin.acts.checkout = [{ status: 200, afterMs: 150 }];
    const view = await mountedStrip();
    act(() => {
      view.result.current.act('reactivate');
      view.result.current.act('reactivate');
    });
    expect(view.result.current.acting).toBe(true);
    await waitFor(() => expect(view.told.opened).toEqual([CHECKOUT_URL]));
    expect(requestsTo('/billing/checkout', 'POST')).toHaveLength(1);
  });
  it('an act taken from the denial closes it once it has run', async () => {
    origin.home = homeOf('halted', { reactivation: reactivationOf() });
    origin.acts.checkout = [refused];
    const view = await mountedStrip();
    act(() => view.result.current.act('reactivate'));
    await waitFor(() => expect(view.result.current.refusal).not.toBeNull());
    act(() => view.result.current.act('plans'));
    await waitFor(() => expect(view.told.plans).toBe(1));
    expect(view.result.current.refusal).toBeNull();
  });
});
