// @vitest-environment happy-dom
import type { PublicPricingRead } from '@heliogrid/contracts';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { usePricing } from '../../src/react/use-pricing';
import { usePricingPage } from '../../src/react/use-pricing-page';
import { listeningOrigin, refusal, send } from './origin-wire';

const PRICING: PublicPricingRead = {
  market: 'IN',
  publishedAt: '2026-04-01T00:00:00.000Z',
  currencyCode: 'INR',
  plans: [
    {
      tier: 'starter',
      price: { kind: 'listed', perCycle: { monthly: '1999.00', yearly: '19990.00' } },
      designCeilingKw: 50,
      proposalsPerMonth: 30,
      activeProjects: 10,
      voiceMinutesIncluded: 0,
      voiceMinuteRate: { kind: 'published', rate: '6.00' },
      storageGb: 10,
    },
    {
      tier: 'pro',
      price: { kind: 'listed', perCycle: { monthly: '9999.00', yearly: '99999.00' } },
      designCeilingKw: 5_000,
      proposalsPerMonth: 1_500,
      activeProjects: 'unlimited',
      voiceMinutesIncluded: 400,
      voiceMinuteRate: { kind: 'published', rate: '6.00' },
      storageGb: 250,
    },
  ],
  trial: {
    days: 14,
    designCeilingKw: 50,
    proposalsPerMonth: 'unlimited',
    voiceMinutes: 15,
    storageGb: 5,
  },
  comparisons: [
    {
      tier: 'pro',
      designCeilingKw: 5_000,
      cycle: 'yearly',
      ours: '99999.00',
      competitor: 'Reslink India',
      rung: 'Premium',
      theirs: '120000.00',
    },
  ],
  benchmarkSources: [],
  taxScheme: 'GST',
  taxExcluded: false,
  salesContact: null,
};

/** The market code picks the origin's answer, so one origin serves every case. */
const origin = listeningOrigin((req, res) => {
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (req.url === '/pricing/IN') return send(res, req, 200, PRICING);
  if (req.url === '/pricing/ZZ') return send(res, req, 404, refusal('NOT_FOUND'));
  return send(res, req, 500, refusal('INTERNAL'));
});

function mounted(marketCode: string) {
  return mountedHook(() => usePricing(marketCode));
}

function mountedHook<T>(hook: () => T) {
  const layer = createDataLayer({ baseUrl: origin.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  return renderHook(hook, { wrapper });
}

afterEach(cleanup);

describe('usePricing — the public price list, through the real client (SCR-M12-01)', () => {
  it.each([
    { name: 'a market with prices', code: 'IN', kind: 'ready' },
    { name: 'a market that publishes none', code: 'ZZ', kind: 'empty' },
    { name: 'a server that fails', code: 'XX', kind: 'failed' },
  ])('reads $name as $kind', async ({ code, kind }) => {
    const view = mounted(code);
    await waitFor(() => expect(view.result.current.kind).toBe(kind), { timeout: 5_000 });
  });
});

describe('usePricingPage — the choices the pricing page holds (SCR-M12-01)', () => {
  async function ready() {
    const view = mountedHook(() => usePricingPage('IN'));
    await waitFor(() => expect(view.result.current.view).not.toBeNull(), { timeout: 5_000 });
    return view;
  }

  it('prints each design ceiling in its unit', async () => {
    const view = await ready();
    const { plans, comparisons, trialDesignPower } = view.result.current.view ?? {};
    expect(plans?.map((plan) => plan.designPower)).toEqual([
      { amount: 50, unit: 'kW' },
      { amount: 5, unit: 'MW' },
    ]);
    expect(comparisons?.[0]?.power).toEqual({ amount: 5, unit: 'MW' });
    expect(trialDesignPower).toEqual({ amount: 50, unit: 'kW' });
  });

  it('pairs two different sold plans, and Against never offers Plan', async () => {
    const view = await ready();
    expect(view.result.current.pair).toEqual({ plan: 'starter', against: 'pro' });
    act(() => view.result.current.choosePlan('pro'));
    expect(view.result.current.pair).toEqual({ plan: 'pro', against: 'starter' });
    expect(view.result.current.againstOptions).toEqual(['starter']);
    act(() => view.result.current.chooseAgainst('starter'));
    expect(view.result.current.pair).toEqual({ plan: 'pro', against: 'starter' });
  });

  it('opens one plan’s limits at a time, and each row toggles in place', async () => {
    const view = await ready();
    act(() => view.result.current.togglePlan('starter'));
    expect(view.result.current.openPlan).toBe('starter');
    act(() => view.result.current.togglePlan('pro'));
    expect(view.result.current.openPlan).toBe('pro');
    act(() => view.result.current.togglePlan('pro'));
    expect(view.result.current.openPlan).toBeNull();
    act(() => {
      view.result.current.toggleIncludes();
      view.result.current.toggleCompare();
      view.result.current.toggleTrial();
      view.result.current.chooseCycle('yearly');
      view.result.current.chooseSet('charges');
    });
    const now = view.result.current;
    expect([now.includesOpen, now.compareOpen, now.trialOpen, now.cycle, now.set]).toEqual([
      true,
      true,
      true,
      'yearly',
      'charges',
    ]);
  });

  it('holds no view while the market publishes no prices', async () => {
    const view = mountedHook(() => usePricingPage('ZZ'));
    await waitFor(() => expect(view.result.current.read.kind).toBe('empty'), { timeout: 5_000 });
    expect(view.result.current.view).toBeNull();
    expect(view.result.current.pair).toBeNull();
    expect(view.result.current.againstOptions).toEqual([]);
  });
});
