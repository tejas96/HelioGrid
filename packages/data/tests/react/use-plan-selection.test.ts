// @vitest-environment happy-dom

import { focusManager } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CHECKOUT_URL, homeOf } from './billing-home-fixtures';
import { mounted, mountedPlans, origin, refusal, requestsTo, SALES } from './billing-origin';
import { downgradeOf, PAGE_URL, upgradeOf } from './plan-selection-fixtures';

const PREVIEW = '/billing/plan-change/preview';
const CHANGE = '/billing/plan-change';

/**
 * The plans (`SCR-M12-03`) through the real client: who reads what, a pick's preview, the one act
 * each kind takes, a stale preview read again, a refused handoff said on the page, a second press
 * sent nowhere — and Billing's `Keep <plan> instead` (frame 16).
 */
describe('Plans — the screen, through the real client', () => {
  it('an Owner reads the home and the price list, and no preview before a pick', async () => {
    const view = await mountedPlans();
    expect(view.result.current.owner).toBe(true);
    expect(requestsTo('/billing/home')).toHaveLength(1);
    expect(requestsTo('/pricing/IN')).toHaveLength(1);
    expect(requestsTo(PREVIEW)).toHaveLength(0);
    expect(view.result.current.cycle).toBe('monthly');
    expect(view.result.current.comparePlan).toBe('growth');
    expect(view.result.current.against).toBe('pro');
  });

  it('a trial holds no plan: its pair is two plans as the pricing page pairs them, both chosen', async () => {
    origin.home = homeOf('trialing');
    const view = await mountedPlans();
    expect(view.result.current.comparePlan).toBe('growth');
    expect(view.result.current.against).toBe('pro');
    expect(view.result.current.planOptions).toEqual(['starter', 'growth', 'pro', 'enterprise']);
    act(() => view.result.current.choosePlan('pro'));
    expect(view.result.current.comparePlan).toBe('pro');
    expect(view.result.current.against).not.toBe('pro');
  });

  it('a paid plan is compared against one other, and its own plan is not a choice', async () => {
    const view = await mountedPlans();
    expect(view.result.current.comparePlan).toBe('growth');
    expect(view.result.current.planOptions).toEqual([]);
  });

  it('a member reads the standing and the price list, never the home or a preview', async () => {
    origin.roles = [SALES];
    const view = await mountedPlans();
    expect(view.result.current.owner).toBe(false);
    act(() => view.result.current.pick('pro'));
    expect(requestsTo('/billing/standing')).toHaveLength(1);
    expect(requestsTo('/billing/home')).toHaveLength(0);
    expect(requestsTo(PREVIEW)).toHaveLength(0);
  });

  it('the plan already held on its cycle reads nothing and has nothing to review', async () => {
    const view = await mountedPlans();
    act(() => view.result.current.pick('growth'));
    expect(view.result.current.pickedIsHeld).toBe(true);
    act(() => view.result.current.openReview());
    expect(view.result.current.reviewing).toBe(false);
    expect(requestsTo(PREVIEW)).toHaveLength(0);
  });

  it('an upgrade confirms on its preview’s digest and opens the provider’s page; a second press sends nothing', async () => {
    origin.acts.change = [{ status: 200, afterMs: 80 }];
    const view = await mountedPlans();
    act(() => view.result.current.pick('pro'));
    await waitFor(() => expect(view.result.current.preview.kind).toBe('ready'));
    expect(requestsTo(PREVIEW)[0]?.query).toEqual({ tier: 'pro', cycle: 'monthly' });
    act(() => view.result.current.openReview());
    act(() => {
      view.result.current.confirm();
      view.result.current.confirm();
    });
    await waitFor(() => expect(view.told.opened).toEqual([PAGE_URL]));
    await waitFor(() => expect(view.result.current.acting).toBe(false));
    /* The page cannot have been paid yet: nothing is read again until the person comes back. */
    const homeReads = requestsTo('/billing/home').length;
    act(() => focusManager.setFocused(false));
    act(() => focusManager.setFocused(true));
    await waitFor(() => expect(requestsTo('/billing/home').length).toBe(homeReads + 1));
    act(() => focusManager.setFocused(undefined));
    const sent = requestsTo(CHANGE, 'POST');
    expect(sent).toHaveLength(1);
    expect(sent[0]?.body).toEqual({ tier: 'pro', cycle: 'monthly', previewDigest: 'digest-1' });
    await waitFor(() => expect(view.result.current.acting).toBe(false));
  });

  it('a scheduled downgrade closes the review and lands on Billing', async () => {
    origin.previews = [downgradeOf(32_000_000_000)];
    origin.acts.change = [
      { status: 200, body: { outcome: 'scheduled', effectiveAt: '2026-10-01T00:00:00.000Z' } },
    ];
    const view = await mountedPlans();
    act(() => view.result.current.pick('starter'));
    await waitFor(() => expect(view.result.current.preview.kind).toBe('ready'));
    act(() => view.result.current.openReview());
    act(() => view.result.current.confirm());
    await waitFor(() => expect(view.told.billing).toBe(1));
    expect(view.result.current.reviewing).toBe(false);
    expect(view.told.opened).toEqual([]);
  });

  it('a preview the usage moved past is read again, its old rows kept to mark, and nothing is scheduled', async () => {
    origin.previews = [downgradeOf(32_000_000_000), downgradeOf(41_000_000_000, 'digest-2')];
    origin.acts.change = [{ status: 409, body: refusal('PLAN_CHANGE_PREVIEW_CHANGED') }];
    const view = await mountedPlans();
    act(() => view.result.current.pick('starter'));
    await waitFor(() => expect(view.result.current.preview.kind).toBe('ready'));
    act(() => view.result.current.openReview());
    act(() => view.result.current.confirm());
    await waitFor(() => expect(view.result.current.changedFrom?.digest).toBe('digest-1'));
    await waitFor(() => {
      const { preview } = view.result.current;
      expect(preview.kind === 'ready' && preview.value.digest).toBe('digest-2');
    });
    expect(view.result.current.reviewing).toBe(true);
    expect(view.result.current.failure).toBeNull();
    expect(view.told.billing).toBe(0);
  });

  it('a trial converts through checkout, never the plan-change route', async () => {
    origin.home = homeOf('trialing');
    origin.previews = [
      { ...upgradeOf(), kind: 'conversion', from: null, to: { tier: 'growth', cycle: 'monthly' } },
    ];
    const view = await mountedPlans();
    act(() => view.result.current.pick('growth'));
    await waitFor(() => expect(view.result.current.preview.kind).toBe('ready'));
    act(() => view.result.current.openReview());
    act(() => view.result.current.confirm());
    await waitFor(() => expect(view.told.opened).toEqual([CHECKOUT_URL]));
    expect(requestsTo('/billing/checkout', 'POST')[0]?.body).toEqual({
      tier: 'growth',
      cycle: 'monthly',
    });
    expect(requestsTo(CHANGE, 'POST')).toHaveLength(0);
  });

  it('a handoff the gateway refused closes the review and says so on the page; Try again re-sends', async () => {
    origin.acts.change = [{ status: 502, body: refusal('GATEWAY_UNAVAILABLE') }];
    const view = await mountedPlans();
    act(() => view.result.current.pick('pro'));
    await waitFor(() => expect(view.result.current.preview.kind).toBe('ready'));
    act(() => view.result.current.openReview());
    act(() => view.result.current.confirm());
    await waitFor(() =>
      expect(view.result.current.failure).toEqual({ where: 'page', why: 'gateway_down' }),
    );
    expect(view.result.current.reviewing).toBe(false);
    act(() => view.result.current.confirm());
    await waitFor(() => expect(view.told.opened).toEqual([PAGE_URL]));
    expect(requestsTo(CHANGE, 'POST')).toHaveLength(2);
  });

  it('a row that cannot change says why in the review', async () => {
    origin.acts.change = [{ status: 409, body: refusal('PLAN_CHANGE_NOT_POSSIBLE') }];
    const view = await mountedPlans();
    act(() => view.result.current.pick('pro'));
    await waitFor(() => expect(view.result.current.preview.kind).toBe('ready'));
    act(() => view.result.current.openReview());
    act(() => view.result.current.confirm());
    await waitFor(() =>
      expect(view.result.current.failure).toEqual({ where: 'sheet', why: 'not_possible' }),
    );
    expect(view.result.current.reviewing).toBe(true);
  });
});

describe('Billing — a scheduled change (frame 16)', () => {
  it('Keep <plan> instead withdraws the change and lands its done', async () => {
    origin.home = homeOf('active', {
      scheduledChange: {
        kind: 'downgrade',
        tier: 'starter',
        cycle: 'monthly',
        effectiveAt: '2099-10-01T00:00:00.000Z',
        afterwards: { list: '1999.00', taxRateBasisPoints: null, tax: null, total: '1999.00' },
      },
    });
    const view = await mounted();
    expect(view.result.current.need).toBe('scheduled_change');
    act(() => view.result.current.needAct());
    await waitFor(() => expect(view.result.current.done).toEqual({ kind: 'kept' }));
    expect(requestsTo('/billing/plan-change/withdraw', 'POST')).toHaveLength(1);
  });
});
