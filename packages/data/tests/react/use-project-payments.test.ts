// @vitest-environment happy-dom
import { onlineManager } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useProjectPayments } from '../../src/react/use-project-payments';
import { refusal } from './origin-wire';
import {
  answerNext,
  BOOKING,
  ENTRY,
  INSTALL,
  mountedOver,
  origin,
  paid,
  paymentRefused,
  settle,
  USED_UTR,
} from './payments-origin';
import { FILE_ID, PROJECT_ID, TODAY } from './projects-fixtures';

/**
 * The payments screen (`SCR-M11-02`) through the real client: a payment is saved first and its
 * receipt photo stored against it after, so a slow photo never holds the money back (`M11-37`); a
 * refusal stays in the sheet with what the api said; a request handed to another app is recorded as
 * shared only when the person says it went out; offline no money act leaves the device (`M11-06`).
 */

const PAYMENTS = `/projects/${PROJECT_ID}/payments`;
const TYPED = {
  partId: BOOKING,
  amount: '100000.00',
  mode: 'upi',
  reference: 'UTR1',
  receivedOn: TODAY,
};
const PHOTO = {
  file: { bytes: new Uint8Array([1, 2, 3, 4]), name: 'r.jpg', contentType: 'image/jpeg' as const },
  preview: 'blob:r',
};

afterEach(() => onlineManager.setOnline(true));

async function mounted() {
  const view = mountedOver(() => useProjectPayments(PROJECT_ID));
  await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
  return view;
}

describe('Payments — recording money', () => {
  it('saves the payment first, then stores its photo against that payment (M11-37)', async () => {
    const view = await mounted();
    act(() => view.result.current.open({ kind: 'record', partId: BOOKING }));
    act(() => view.result.current.pickPhoto(PHOTO));
    act(() => view.result.current.send({ kind: 'record', typed: TYPED }));
    await waitFor(() =>
      expect(view.result.current.toast).toEqual({ kind: 'recorded', receiptNumber: 'RCPT-0001' }),
    );
    await waitFor(() => expect(view.result.current.attaching).toEqual([]));
    expect(origin.writes.map((write) => write.path)).toEqual([
      PAYMENTS,
      '/files',
      `/files/${FILE_ID}/complete`,
    ]);
    expect(origin.writes[0]?.body).not.toHaveProperty('fileId');
    expect(origin.writes[1]?.body).toMatchObject({
      subjectKind: 'project_payment',
      subjectRef: ENTRY,
    });
    expect(view.result.current.sheet).toBeNull();
    expect(view.result.current.photo).toBeNull();
  });

  it('the toast names the payment this save wrote, even when another landed after it', async () => {
    const answer = paid();
    const other = { ...answer.entries[0], id: INSTALL, receiptNumber: 'RCPT-0002' };
    answerNext('payments', {
      status: 201,
      body: { ...answer, entries: [...answer.entries, other], recordedId: ENTRY },
    });
    const view = await mounted();
    act(() => view.result.current.send({ kind: 'record', typed: TYPED }));
    await waitFor(() =>
      expect(view.result.current.toast).toEqual({ kind: 'recorded', receiptNumber: 'RCPT-0001' }),
    );
  });

  it('without a photo writes the payment alone', async () => {
    const view = await mounted();
    act(() => view.result.current.send({ kind: 'record', typed: TYPED }));
    await waitFor(() => expect(view.result.current.toast?.kind).toBe('recorded'));
    expect(origin.writes.map((write) => write.path)).toEqual([PAYMENTS]);
  });

  it('a photo that fails to store leaves the payment saved, and Try again stores it', async () => {
    answerNext('files', { status: 500, body: refusal('INTERNAL') });
    const view = await mounted();
    act(() => view.result.current.pickPhoto(PHOTO));
    act(() => view.result.current.send({ kind: 'record', typed: TYPED }));
    await waitFor(() => expect(view.result.current.toast).toEqual({ kind: 'photoNotStored' }));
    expect(origin.writes.filter((write) => write.path === PAYMENTS)).toHaveLength(1);
    act(() => view.result.current.toastAct?.());
    await waitFor(() => expect(view.result.current.toast).toEqual({ kind: 'photoAdded' }));
    expect(origin.writes.filter((write) => write.path === '/files')).toHaveLength(2);
  });

  it('a photo added to a payment later is stored against that payment', async () => {
    const view = await mounted();
    act(() => view.result.current.addPhoto(ENTRY, PHOTO));
    await waitFor(() => expect(view.result.current.toast).toEqual({ kind: 'photoAdded' }));
    expect(origin.writes[0]?.body).toMatchObject({
      subjectKind: 'project_payment',
      subjectRef: ENTRY,
    });
  });

  it('a save pressed again after its answer was lost is the same payment', async () => {
    answerNext('payments', 'drop');
    const view = await mounted();
    act(() => view.result.current.pickPhoto(PHOTO));
    act(() => view.result.current.send({ kind: 'record', typed: TYPED }));
    await waitFor(() => expect(view.result.current.failure).toEqual({ kind: 'failed' }));
    act(() => view.result.current.send({ kind: 'record', typed: TYPED }));
    await waitFor(() => expect(view.result.current.toast?.kind).toBe('recorded'));
    const saves = origin.writes.filter((write) => write.path === PAYMENTS);
    expect(saves).toHaveLength(2);
    expect(saves[1]?.key).toBe(saves[0]?.key);
    await waitFor(() =>
      expect(origin.writes.filter((write) => write.path === '/files')).toHaveLength(1),
    );
  });

  it('a reused UTR is refused in the sheet, naming the receipt it is on', async () => {
    answerNext('payments', { status: 422, body: paymentRefused('reference_used', 'RCPT-0007') });
    const view = await mounted();
    act(() => view.result.current.open({ kind: 'record', partId: BOOKING }));
    act(() => view.result.current.send({ kind: 'record', typed: TYPED }));
    await waitFor(() =>
      expect(view.result.current.failure).toEqual({
        kind: 'refused',
        refusal: 'reference_used',
        receiptNumber: 'RCPT-0007',
      }),
    );
    expect(view.result.current.sheet).toEqual({ kind: 'record', partId: BOOKING });
    expect(view.result.current.failureField).toBe('reference');
  });

  it('offline, a money act says so and sends nothing', async () => {
    const view = await mounted();
    act(() => onlineManager.setOnline(false));
    act(() => view.result.current.send({ kind: 'waive', partId: BOOKING, reason: 'Goodwill' }));
    expect(view.result.current.failure).toEqual({ kind: 'offline' });
    await settle();
    expect(origin.writes).toEqual([]);
  });
});

describe('Payments — the QR held up to the customer', () => {
  it.each([
    ['a part with a UPI request shows its QR', BOOKING, 'upi://pay?pa=epc@okaxis&am=100000.00'],
    ['a part over the UPI cap has none to show', INSTALL, null],
    ['closed, nothing shows', null, null],
  ])('%s', async (_, partId, uri) => {
    const view = await mounted();
    act(() => view.result.current.showQr(partId));
    expect(view.result.current.fullQr?.upiUri ?? null).toBe(uri);
  });
});

describe('Payments — the request handed to another app', () => {
  it('closes the sheet, asks whether it went out, and records nothing until the person says so', async () => {
    const view = await mounted();
    act(() => view.result.current.open({ kind: 'collect', partId: BOOKING }));
    act(() => view.result.current.handedOff(BOOKING));
    expect(view.result.current.toast).toEqual({ kind: 'askSent', partId: BOOKING });
    expect(view.result.current.sheet).toBeNull();
    await settle();
    expect(origin.writes).toEqual([]);
  });

  it('records the request as shared once the person says it went out', async () => {
    const view = await mounted();
    act(() => view.result.current.handedOff(BOOKING));
    act(() => view.result.current.toastAct?.());
    await waitFor(() => expect(view.result.current.toast).toEqual({ kind: 'shared' }));
    expect(origin.writes.map((write) => write.path)).toEqual([
      `/projects/${PROJECT_ID}/parts/${BOOKING}/shared`,
    ]);
  });
});

describe('Payments — the reference while it is typed (M11-38)', () => {
  it.each([
    ['nothing typed: nothing asked', '', { kind: 'unchecked' }],
    [
      'a reference on a receipt, typed with spaces: the receipt it is on',
      '4321 8765 3390',
      { kind: 'used', receiptNumber: 'RCPT-0007' },
    ],
    ['a new reference: said to be new', '999988887777', { kind: 'new' }],
  ])('%s', async (_, typed, standing) => {
    const view = await mounted();
    act(() => view.result.current.reference.check(typed));
    if (standing.kind !== 'unchecked') {
      await waitFor(() => expect(view.result.current.reference.standing).toEqual(standing));
    } else {
      await settle();
      expect(view.result.current.reference.standing).toEqual(standing);
      expect(origin.sent.filter((one) => one.includes('/payments/references'))).toEqual([]);
    }
  });
});

describe('Payments — the reference check starts empty with each sheet', () => {
  it.each([
    ['a sheet opened after one that had a used UTR', 'open'],
    ['a sheet closed with a used UTR', 'close'],
  ] as const)('%s: says nothing', async (_, how) => {
    const view = await mounted();
    act(() => view.result.current.open({ kind: 'record', partId: BOOKING }));
    act(() => view.result.current.reference.check(USED_UTR));
    await waitFor(() => expect(view.result.current.reference.standing.kind).toBe('used'));
    act(() =>
      how === 'open'
        ? view.result.current.open({ kind: 'record', partId: INSTALL })
        : view.result.current.close(),
    );
    expect(view.result.current.reference.standing).toEqual({ kind: 'unchecked' });
  });
});

describe('Payments — the receipt PDF', () => {
  it.each([
    ['made or kept: its link', true, 'https://store/rcpt.pdf'],
    ['still being made: nothing yet', false, null],
  ])('%s', async (_, ready, link) => {
    if (!ready) origin.receiptPdf = null;
    const view = await mounted();
    expect(await view.result.current.receiptPdf(ENTRY)).toBe(link);
  });
});
