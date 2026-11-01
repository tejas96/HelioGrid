// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  CHECKOUT_URL,
  CREDIT_NOTE,
  DOCUMENT_ID,
  documentRows,
  dueOf,
  homeOf,
  NEXT_NOTICE,
  PAY_URL,
  RENEWAL_URL,
  RUNS_UNTIL,
  reactivationOf,
  refundOf,
  reminderRows,
  renewalOf,
  SIGNED_URL,
} from './billing-home-fixtures';
import { mounted, mountedRecords, origin, refusal, requestsTo, SALES } from './billing-origin';

/**
 * Billing's page and its record lists through the real client (`SCR-M12-02`): who reads what, the
 * one act each need takes, the two asks, every answer an act can meet, and a second press sent
 * nowhere.
 */
describe('Billing — the page, through the real client', () => {
  it('an Owner reads the home and never the standing; a member the standing and owners, never the home', async () => {
    const owner = await mounted();
    expect(owner.result.current.owner).toBe(true);
    expect(owner.result.current.read).toMatchObject({ kind: 'ready', value: { kind: 'owner' } });
    expect(requestsTo('/billing/home')).toHaveLength(1);
    expect(requestsTo('/billing/standing')).toHaveLength(0);
    expect(requestsTo('/tenants/me/owners')).toHaveLength(0);
    owner.unmount();
    origin.requests = [];

    origin.roles = [SALES];
    const member = await mounted();
    expect(member.result.current.owner).toBe(false);
    expect(member.result.current.read).toMatchObject({
      kind: 'ready',
      value: { kind: 'member', owners: { owners: [{ name: 'Rajesh Sharma' }] } },
    });
    expect(requestsTo('/billing/standing')).toHaveLength(1);
    expect(requestsTo('/tenants/me/owners')).toHaveLength(1);
    expect(requestsTo('/billing/home')).toHaveLength(0);
  });

  it('past due: the need’s act opens the failed charge’s pay link', async () => {
    origin.home = homeOf('past_due', { due: dueOf() });
    const view = await mounted();
    expect(view.result.current.need).toBe('pay');
    act(() => view.result.current.needAct());
    expect(view.told.opened).toEqual([PAY_URL]);
    expect(requestsTo('/billing/checkout', 'POST')).toHaveLength(0);
  });

  it('active with an open renewal: the need’s act opens the renewal’s link', async () => {
    origin.home = homeOf('active', { renewal: renewalOf() });
    const view = await mounted();
    expect(view.result.current.need).toBe('renewal');
    act(() => view.result.current.needAct());
    expect(view.told.opened).toEqual([RENEWAL_URL]);
  });

  it('halted with a way back: checks out the reactivation’s plan and opens the returned page', async () => {
    origin.home = homeOf('halted', { reactivation: reactivationOf() });
    const view = await mounted();
    expect(view.result.current.need).toBe('way_back');
    act(() => view.result.current.needAct());
    await waitFor(() => expect(view.told.opened).toEqual([CHECKOUT_URL]));
    const sent = requestsTo('/billing/checkout', 'POST');
    expect(sent).toHaveLength(1);
    expect(sent[0]?.body).toEqual({ tier: 'pro', cycle: 'yearly' });
    await waitFor(() => expect(view.result.current.acting).toBeNull());
  });

  it('expired: the need’s act goes to the plans and sends nothing', async () => {
    origin.home = homeOf('expired');
    const view = await mounted();
    expect(view.result.current.need).toBe('pick_plan');
    act(() => view.result.current.needAct());
    expect(view.told.plans).toBe(1);
    expect(view.told.opened).toEqual([]);
    expect(requestsTo('/billing/checkout', 'POST')).toHaveLength(0);
  });

  it('inside the refund window: the need’s act opens the refund sheet and sends nothing', async () => {
    origin.home = homeOf('active', { refund: refundOf() });
    const view = await mounted();
    expect(view.result.current.need).toBe('refund');
    act(() => view.result.current.needAct());
    expect(view.result.current.sheet).toBe('refund');
    expect(requestsTo('/billing/refund', 'POST')).toHaveLength(0);
    expect(view.told.opened).toEqual([]);
  });

  it('refund: posts once, says the credit note, closes the sheet and reads the home again', async () => {
    origin.home = homeOf('active', { refund: refundOf() });
    const view = await mounted();
    act(() => view.result.current.openSheet('refund'));
    act(() => view.result.current.refund());
    await waitFor(() =>
      expect(view.result.current.done).toEqual({ kind: 'refunded', creditNoteNumber: CREDIT_NOTE }),
    );
    expect(view.result.current.sheet).toBeNull();
    const sent = requestsTo('/billing/refund', 'POST');
    expect(sent).toHaveLength(1);
    expect(sent[0]?.body).toEqual({});
    await waitFor(() => expect(requestsTo('/billing/home')).toHaveLength(2));
  });

  it.each([
    ['too_expensive' as const, { reason: 'too_expensive' }],
    [null, { reason: null }],
  ])(
    'cancel(%s): sends that body exactly and says when the plan runs until',
    async (reason, body) => {
      origin.home = homeOf('active', { cancellable: true });
      const view = await mounted();
      act(() => view.result.current.openSheet('cancel'));
      act(() => view.result.current.cancel(reason));
      await waitFor(() =>
        expect(view.result.current.done).toEqual({ kind: 'cancelled', runsUntil: RUNS_UNTIL }),
      );
      expect(view.result.current.sheet).toBeNull();
      const sent = requestsTo('/billing/cancel', 'POST');
      expect(sent).toHaveLength(1);
      expect(sent[0]?.body).toEqual(body);
    },
  );

  it('502 gateway unavailable: the act says so, nothing else changes, the sheet stays open', async () => {
    origin.home = homeOf('active', { refund: refundOf() });
    origin.acts.refund = [{ status: 502, body: refusal('GATEWAY_UNAVAILABLE') }];
    const view = await mounted();
    act(() => view.result.current.openSheet('refund'));
    act(() => view.result.current.refund());
    await waitFor(() =>
      expect(view.result.current.failure).toEqual({ act: 'refund', why: 'gateway_down' }),
    );
    expect(view.result.current.sheet).toBe('refund');
    expect(view.result.current.done).toBeNull();
    expect(view.result.current.acting).toBeNull();
    expect(requestsTo('/billing/home')).toHaveLength(1);
  });

  it('409 cancel not possible: the act says so and the sheet stays open', async () => {
    origin.home = homeOf('active', { cancellable: true });
    origin.acts.cancel = [{ status: 409, body: refusal('CANCEL_NOT_POSSIBLE') }];
    const view = await mounted();
    act(() => view.result.current.openSheet('cancel'));
    act(() => view.result.current.cancel(null));
    await waitFor(() =>
      expect(view.result.current.failure).toEqual({ act: 'cancel', why: 'cancel_not_possible' }),
    );
    expect(view.result.current.sheet).toBe('cancel');
    expect(view.result.current.done).toBeNull();
  });

  it('a PDF answered 404 fails as the PDF and opens nothing', async () => {
    origin.downloads = [{ status: 404, body: refusal('NOT_FOUND') }];
    const view = await mounted();
    act(() => view.result.current.openPdf(DOCUMENT_ID));
    await waitFor(() => expect(view.result.current.failure).toEqual({ act: 'pdf', why: 'pdf' }));
    expect(view.told.opened).toEqual([]);
  });

  it('a PDF answered 200 opens the signed link', async () => {
    const view = await mounted();
    act(() => view.result.current.openPdf(DOCUMENT_ID));
    await waitFor(() => expect(view.told.opened).toEqual([SIGNED_URL]));
    expect(view.result.current.failure).toBeNull();
  });

  it('a chosen cancel reason is cleared when the sheet closes or another opens', async () => {
    origin.home = homeOf('active', { cancellable: true });
    const view = await mounted();
    expect(view.result.current.reason).toBeNull();
    act(() => view.result.current.openSheet('cancel'));
    act(() => view.result.current.chooseReason('too_expensive'));
    expect(view.result.current.reason).toBe('too_expensive');
    act(() => view.result.current.closeSheet());
    expect(view.result.current.reason).toBeNull();
    act(() => view.result.current.openSheet('cancel'));
    act(() => view.result.current.chooseReason('moving_tool'));
    act(() => view.result.current.openSheet('history'));
    expect(view.result.current.reason).toBeNull();
  });

  it('the PDF being signed is named while its link is out, and none after', async () => {
    origin.downloads = [{ status: 200, afterMs: 300 }];
    const view = await mounted();
    expect(view.result.current.pendingPdf).toBeNull();
    act(() => view.result.current.openPdf(DOCUMENT_ID));
    expect(view.result.current.pendingPdf).toBe(DOCUMENT_ID);
    await waitFor(() => expect(view.told.opened).toEqual([SIGNED_URL]));
    await waitFor(() => expect(view.result.current.pendingPdf).toBeNull());
  });

  it('a second press while an act’s answer is out sends one request', async () => {
    origin.home = homeOf('active', { refund: refundOf() });
    origin.acts.refund = [{ status: 200, afterMs: 300 }];
    const view = await mounted();
    act(() => {
      view.result.current.refund();
      view.result.current.refund();
    });
    expect(view.result.current.acting).toBe('refund');
    await waitFor(() => expect(view.result.current.done).not.toBeNull());
    expect(requestsTo('/billing/refund', 'POST')).toHaveLength(1);
  });
});

describe('Billing — the record lists, through the real client', () => {
  it('invoices: sends page and limit, q and status only when set; counts ride the first page', async () => {
    origin.documents = documentRows(60);
    const view = await mountedRecords(true);
    await waitFor(() => expect(view.result.current.documents.read.kind).toBe('ready'));
    expect(requestsTo('/billing/documents')[0]?.query).toEqual({ page: '1', limit: '50' });
    expect(view.result.current.documents.counts).toEqual({ all: 60, paid: 30, failed: 30 });
    expect(view.result.current.documents.total).toBe(60);

    act(() => view.result.current.documents.search('INV-000'));
    await waitFor(() => expect(view.result.current.documents.counts.all).toBe(9));
    const searched = requestsTo('/billing/documents').at(-1);
    expect(searched?.query).toEqual({ page: '1', limit: '50', q: 'INV-000' });

    act(() => view.result.current.documents.choose('failed'));
    await waitFor(() =>
      expect(requestsTo('/billing/documents').at(-1)?.query).toEqual({
        page: '1',
        limit: '50',
        q: 'INV-000',
        status: 'failed',
      }),
    );
    await waitFor(() => expect(view.result.current.documents.total).toBe(4));
  });

  it('invoices: show more asks page 2 only while more remain', async () => {
    origin.documents = documentRows(60);
    const view = await mountedRecords(true);
    await waitFor(() => expect(view.result.current.documents.more).toBe(true));
    act(() => view.result.current.documents.showMore());
    await waitFor(() => expect(view.result.current.documents.more).toBe(false));
    act(() => view.result.current.documents.showMore());
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(requestsTo('/billing/documents').map((r) => r.query.page)).toEqual(['1', '2']);
    expect(view.result.current.documents.counts.all).toBe(60);
  });

  it('shut sheets send nothing; opening one reads it', async () => {
    origin.documents = documentRows(3);
    origin.reminders = reminderRows(3);
    const view = await mountedRecords(false);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(requestsTo('/billing/documents')).toHaveLength(0);
    expect(requestsTo('/billing/reminders')).toHaveLength(0);
    view.rerender({ isOpen: true });
    await waitFor(() => expect(requestsTo('/billing/documents')).toHaveLength(1));
  });

  it('reminders: expose the notice the ladder tells next from the first page', async () => {
    origin.reminders = reminderRows(60);
    const view = await mountedRecords(true);
    await waitFor(() => expect(view.result.current.reminders.upcoming).toEqual(NEXT_NOTICE));
    act(() => view.result.current.reminders.showMore());
    await waitFor(() => expect(requestsTo('/billing/reminders')).toHaveLength(2));
    await waitFor(() => expect(view.result.current.reminders.more).toBe(false));
    expect(view.result.current.reminders.upcoming).toEqual(NEXT_NOTICE);
  });
});
