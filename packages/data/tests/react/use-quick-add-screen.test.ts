// @vitest-environment happy-dom
import { IN_FORMATS, type QuickAddDone } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type QuickAddOptions, useQuickAddScreen } from '../../src/react/use-quick-add-screen';
import { useSession } from '../../src/react/use-session';
import { refusal } from './origin-wire';
import {
  CUSTOMER_ID,
  LEAD_ID,
  mountedOver,
  NEW_LEAD_ID,
  NO_OVERRIDE,
  OUTSIDE,
  origin,
  PRIYA,
  REFERRER_CUSTOMER_ID,
  REFERRER_LEAD_ID,
  TYPED,
  writesSent,
} from './quick-add-origin';

const duplicateOf = (match: unknown) => ({
  status: 409,
  body: { error: { ...refusal('DUPLICATE_PHONE').error, facts: match } },
});

/** Quick add mounted over the origin, with what it handed the route and the toast. */
async function mounted(referredBy: string | null = null) {
  const done: QuickAddDone[] = [];
  const opened: string[] = [];
  const closed: boolean[] = [];
  const options: QuickAddOptions = {
    pack: IN_FORMATS,
    referredBy,
    onClosed: () => closed.push(true),
    onOpenLead: (address) => opened.push(address),
    onDone: (answer) => done.push(answer),
  };
  const view = mountedOver(() => ({ session: useSession(), screen: useQuickAddScreen(options) }));
  await waitFor(() => expect(view.result.current.session.user?.tenant?.id).toBeTruthy());
  const screen = () => view.result.current.screen;
  return { view, screen, done, opened, closed };
}

type Mounted = Awaited<ReturnType<typeof mounted>>;

/** Types a whole number and waits for the live check to answer it. */
async function typeNumber({ screen }: Mounted, kind: string) {
  act(() => screen().setPhone(TYPED));
  await waitFor(() => expect(screen().check.kind).toBe(kind));
}

describe('the live number check (M02-07)', () => {
  it('asks once the number is whole and the typing has settled', async () => {
    const quick = await mounted();
    act(() => quick.screen().setPhone('+9198220'));
    expect(quick.screen().check).toEqual({ kind: 'none' });
    act(() => quick.screen().setPhone(TYPED));
    expect(quick.screen().check).toEqual({ kind: 'checking' });
    await waitFor(() => expect(quick.screen().check).toEqual({ kind: 'new' }));
    expect(origin.sent.filter((request) => request === 'GET /customers/match')).toHaveLength(1);
  });

  it('a check that cannot answer says so and Save still sends', async () => {
    origin.match = { status: 403, body: refusal('FORBIDDEN') };
    const quick = await mounted();
    await typeNumber(quick, 'unchecked');
    act(() => quick.screen().save());
    await waitFor(() => expect(quick.done).toEqual([{ kind: 'saved', leadId: NEW_LEAD_ID }]));
  });

  it('a matched number opens the sheet over the capture, which waits under it, and dismissing it creates nothing', async () => {
    origin.match = PRIYA;
    const quick = await mounted();
    await typeNumber(quick, 'known');
    expect(quick.screen().duplicate?.record).toEqual({
      kind: 'visible',
      name: 'Priya Sharma',
      city: 'Nashik',
    });
    act(() => quick.screen().close());
    expect(quick.screen().open).toBe(true);
    expect(quick.closed).toEqual([]);
    act(() => quick.screen().dismissDuplicate());
    expect(quick.screen().duplicate).toBe(null);
    expect(quick.screen().open).toBe(true);
    expect(quick.screen().draft.phoneE164).toBe(TYPED);
    expect(writesSent()).toEqual([]);
  });
});

describe('saving a capture (M02-01, M02-03, M02-66)', () => {
  it('a phone alone saves, invents nothing, and the capture closes with the lead saved', async () => {
    const quick = await mounted();
    await typeNumber(quick, 'new');
    act(() => quick.screen().save());
    await waitFor(() => expect(quick.done).toEqual([{ kind: 'saved', leadId: NEW_LEAD_ID }]));
    expect(origin.bodies).toEqual([{ phoneE164: TYPED, capturedAt: expect.any(String) }]);
    expect(quick.screen().open).toBe(false);
  });

  it('the type starts on the segment the company declared', async () => {
    origin.segment = 'ci';
    const quick = await mounted();
    await waitFor(() => expect(quick.screen().draft.segment).toBe('commercial'));
  });

  it('a second press while the save is out sends nothing', async () => {
    const quick = await mounted();
    await typeNumber(quick, 'new');
    act(() => {
      quick.screen().save();
      quick.screen().save();
    });
    await waitFor(() => expect(quick.done).toHaveLength(1));
    expect(writesSent()).toEqual(['POST /leads']);
  });

  it('a save that came back undone keeps the typing, and its retry is the same request', async () => {
    origin.writes = [{ status: 500, body: refusal('INTERNAL') }];
    const quick = await mounted();
    await typeNumber(quick, 'new');
    act(() => quick.screen().setName('Priya'));
    act(() => quick.screen().save());
    await waitFor(() => expect(quick.screen().saveFailure).not.toBe(null));
    expect(quick.screen().draft.name).toBe('Priya');
    expect(quick.screen().open).toBe(true);
    act(() => quick.screen().save());
    await waitFor(() => expect(quick.done).toHaveLength(1));
    expect(origin.keys[1]).toBe(origin.keys[0]);
    expect(origin.bodies[1]).toEqual(origin.bodies[0]);
  });

  it('a save the server finds a duplicate opens the sheet with the typing kept', async () => {
    origin.writes = [duplicateOf(OUTSIDE)];
    const quick = await mounted();
    await typeNumber(quick, 'new');
    act(() => quick.screen().setCity('Nashik'));
    act(() => quick.screen().save());
    await waitFor(() => expect(quick.screen().duplicate?.opens).toBe('ask_owner'));
    expect(quick.screen().draft.city).toBe('Nashik');
    expect(quick.done).toEqual([]);
  });

  it.each([
    ['', { kind: 'missing' }],
    ['+91982204', { kind: 'digits', typed: 6, needed: 10 }],
  ])('Save on "%s" is refused at the phone and sends nothing', async (typed, phoneRefusal) => {
    const quick = await mounted();
    act(() => quick.screen().setPhone(typed));
    act(() => quick.screen().save());
    expect(quick.screen().phoneRefusal).toEqual(phoneRefusal);
    expect(quick.screen().phoneFocus).toBe(1);
    expect(writesSent()).toEqual([]);
  });

  it('closing sends nothing and hands the route its way out', async () => {
    const quick = await mounted();
    act(() => quick.screen().setPhone(TYPED));
    act(() => quick.screen().close());
    expect(quick.screen().open).toBe(false);
    expect(quick.closed).toEqual([true]);
    expect(writesSent()).toEqual([]);
  });
});

describe('the duplicate sheet’s three answers (M02-08, M02-09, M02-11, M02-12)', () => {
  it('open existing on a record in scope opens it and sends nothing', async () => {
    origin.match = PRIYA;
    const quick = await mounted();
    await typeNumber(quick, 'known');
    act(() => quick.screen().openExisting());
    expect(quick.opened).toEqual([`leads/${LEAD_ID}`]);
    expect(writesSent()).toEqual([]);
  });

  it('open existing outside the scope asks its owner', async () => {
    origin.match = OUTSIDE;
    const quick = await mounted();
    await typeNumber(quick, 'known');
    act(() => quick.screen().openExisting());
    await waitFor(() =>
      expect(quick.done).toEqual([{ kind: 'owner_asked', ownerName: 'Rajesh Jadhav' }]),
    );
    expect(writesSent()).toEqual([`POST /leads/${LEAD_ID}/owner-requests`]);
  });

  it('log enquiry adds what was typed to the existing lead', async () => {
    origin.match = PRIYA;
    const quick = await mounted();
    await typeNumber(quick, 'known');
    act(() => quick.screen().logEnquiry());
    await waitFor(() =>
      expect(quick.done).toEqual([
        { kind: 'enquiry_logged', leadId: LEAD_ID, name: 'Priya Sharma' },
      ]),
    );
    expect(origin.bodies).toEqual([{ phoneE164: TYPED, capturedAt: expect.any(String) }]);
  });

  it('log enquiry outside the scope adds it to the existing lead, naming no one', async () => {
    origin.match = OUTSIDE;
    const quick = await mounted();
    await typeNumber(quick, 'known');
    act(() => quick.screen().logEnquiry());
    await waitFor(() =>
      expect(quick.done).toEqual([{ kind: 'enquiry_logged', leadId: LEAD_ID, name: null }]),
    );
    expect(writesSent()).toEqual([`POST /leads/${LEAD_ID}/enquiries`]);
  });

  it('an act that came back undone is said under its choice, and the sheet stays', async () => {
    origin.match = PRIYA;
    origin.writes = [{ status: 500, body: refusal('INTERNAL') }];
    const quick = await mounted();
    await typeNumber(quick, 'known');
    act(() => quick.screen().logEnquiry());
    await waitFor(() => expect(quick.screen().act?.state).toBe('failed'));
    expect(quick.screen().act?.choice).toBe('log_enquiry');
    expect(quick.screen().duplicate).not.toBe(null);
  });

  it('keep both sends the reason and the customer it is kept beside', async () => {
    origin.match = PRIYA;
    const quick = await mounted();
    await typeNumber(quick, 'known');
    expect(quick.screen().duplicate?.canKeepBoth).toBe(true);
    act(() => quick.screen().keepBoth('Same family, a second roof'));
    await waitFor(() => expect(quick.done).toEqual([{ kind: 'saved', leadId: NEW_LEAD_ID }]));
    expect(origin.bodies).toEqual([
      {
        phoneE164: TYPED,
        capturedAt: expect.any(String),
        keepBoth: { otherCustomerId: CUSTOMER_ID, reason: 'Same family, a second roof' },
      },
    ]);
  });

  it('keep both sends nothing for a person who may not override', async () => {
    origin.roles = NO_OVERRIDE;
    origin.match = PRIYA;
    const quick = await mounted();
    await typeNumber(quick, 'known');
    expect(quick.screen().duplicate?.canKeepBoth).toBe(false);
    act(() => quick.screen().keepBoth('Same family'));
    expect(writesSent()).toEqual([]);
  });
});

describe('a referral (M02-16)', () => {
  it('names its referrer and saves the lead as theirs', async () => {
    const quick = await mounted(REFERRER_LEAD_ID);
    await waitFor(() => expect(quick.screen().referrer?.name).toBe('Meera Joshi'));
    await typeNumber(quick, 'new');
    act(() => quick.screen().save());
    await waitFor(() => expect(quick.done).toHaveLength(1));
    expect(origin.bodies).toEqual([
      {
        phoneE164: TYPED,
        capturedAt: expect.any(String),
        referredBy: { customerId: REFERRER_CUSTOMER_ID },
      },
    ]);
  });
});
