// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useOwnerDashboard } from '../../src/react/use-owner-dashboard';
import { useTenantId } from '../../src/react/use-tenant-id';
import {
  answerNext,
  mountedOver,
  OWNER,
  origin,
  REP,
  readsOf,
  settle,
  writesTo,
} from './home-origin';

/**
 * The owner dashboard (`SCR-M13-01`) through the real client: read only on its home; what needs
 * you in its fixed order with nothing waiting left out; win rate on closed deals; the inline
 * target set for the read's own month.
 */
describe('owner dashboard', () => {
  it('a home without it reads nothing', async () => {
    origin.roles = [REP];
    const view = mountedOver(() => ({ board: useOwnerDashboard(), tenant: useTenantId() }));
    await waitFor(() => expect(view.result.current.tenant).not.toBe(''));
    await settle();
    expect(view.result.current.board.shown).toBe(false);
    expect(readsOf('/dashboards/owner')).toEqual([]);
  });

  it('needs you in order, zeros left out, and the win rate', async () => {
    origin.roles = [OWNER];
    const view = mountedOver(() => useOwnerDashboard());
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    expect(view.result.current.needsYou).toEqual([
      'unassigned',
      'blocked_on_us',
      'my_overdue_tasks',
    ]);
    expect(view.result.current.winRate).toEqual({
      kind: 'rate',
      won: 13,
      lost: 29,
      basisPoints: 3095,
    });
  });

  it('a target is set for the read month, then the dashboard reads again', async () => {
    origin.roles = [OWNER];
    const view = mountedOver(() => useOwnerDashboard());
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    act(() => view.result.current.setTarget('3000000.00'));
    await waitFor(() => expect(readsOf('/dashboards/owner').length).toBeGreaterThan(1));
    expect(writesTo('/dashboards/target').map((write) => write.body)).toEqual([
      { month: '2026-11', amount: '3000000.00' },
    ]);
  });

  it('a refused target says so', async () => {
    origin.roles = [OWNER];
    const view = mountedOver(() => useOwnerDashboard());
    await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
    answerNext('target', {
      status: 422,
      body: { error: { code: 'TARGET_MONTH_NOT_CURRENT', message: 'month turned' } },
    });
    act(() => view.result.current.setTarget(null));
    await waitFor(() => expect(view.result.current.targetFailed).toBe(true));
  });
});
