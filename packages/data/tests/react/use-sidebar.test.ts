// @vitest-environment happy-dom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSidebar } from '../../src/react/use-sidebar';
import { homeOf } from './billing-home-fixtures';
import { origin, requestsTo, SALES, wrapperOf } from './billing-origin';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A trial that ends `days` from now, as the Owner's billing home tells it. */
function trialEnding(days: number) {
  const home = homeOf('trialing');
  return {
    ...home,
    standing: { ...home.standing, trialEndsAt: new Date(Date.now() + days * DAY_MS).toISOString() },
  };
}

function mountedSidebar() {
  return renderHook(() => useSidebar(), { wrapper: wrapperOf() });
}

/**
 * The sidebar's facts through the real client: the trial's days from the read the billing strip
 * makes, whole days as the strip counts them; a figure whose read failed is null; and a row the
 * presets do not open is never read for its figure.
 */
describe('The sidebar, through the real client', () => {
  it.each([
    { left: 10.2, shown: 11 },
    { left: 0.1, shown: 1 },
  ])('a trial with $left days left counts $shown days', async ({ left, shown }) => {
    origin.home = trialEnding(left);
    const view = mountedSidebar();
    await waitFor(() => expect(view.result.current.counts.trialDaysLeft).toBe(shown));
  });

  it('a paid plan shows no days, and a figure whose read failed is null', async () => {
    origin.home = homeOf('active');
    const view = mountedSidebar();
    await waitFor(() => expect(requestsTo('/billing/home').length).toBeGreaterThan(0));
    // This origin answers no catalog or roster read: both figures stay null.
    await waitFor(() => expect(requestsTo('/catalog/items').length).toBeGreaterThan(0));
    expect(view.result.current.counts).toEqual({
      catalogItems: null,
      trialDaysLeft: null,
      people: null,
    });
  });

  it('a member reads the standing, never the home, and no figure of a row they cannot open', async () => {
    origin.roles = [SALES];
    origin.home = trialEnding(3);
    const view = mountedSidebar();
    await waitFor(() => expect(view.result.current.counts.trialDaysLeft).toBe(3));
    expect(requestsTo('/billing/home')).toHaveLength(0);
    expect(requestsTo('/tenants/me/members')).toHaveLength(0);
  });

  it('Leads and Projects are marked Soon until their modules land; Home and More never are', async () => {
    const view = mountedSidebar();
    const { soon } = view.result.current;
    expect([soon('leads'), soon('projects'), soon('home'), soon('more')]).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });
});
