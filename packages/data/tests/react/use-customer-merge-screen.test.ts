// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  type CustomerMergeOptions,
  useCustomerMergeScreen,
} from '../../src/react/use-customer-merge-screen';
import { useSession } from '../../src/react/use-session';
import {
  BLOCKED_OUTSIDE,
  mergesSent,
  mountedOver,
  NO_MERGE,
  origin,
  SUNITA_ID,
  SURVIVOR_LEAD_ID,
  VINAYAK_ID,
} from './customer-merge-origin';
import { refusal } from './origin-wire';

/** Customer Merge mounted over the origin, from Sunita's lead — with Vinayak too, or not yet. */
async function mounted(loserId: string | null = VINAYAK_ID) {
  const opened: string[] = [];
  const options: CustomerMergeOptions = {
    survivorId: SUNITA_ID,
    loserId,
    onOpenLead: (address) => opened.push(address),
  };
  const view = mountedOver(() => ({
    session: useSession(),
    screen: useCustomerMergeScreen(options),
  }));
  await waitFor(() => expect(view.result.current.session.user?.tenant?.id).toBeTruthy());
  const screen = () => view.result.current.screen;
  return { screen, opened };
}

type Mounted = Awaited<ReturnType<typeof mounted>>;

async function compared({ screen }: Mounted) {
  await waitFor(() => expect(screen().read.kind).toBe('ready'));
}

/** Keeps Sunita's name and Vinayak's city and primary contact. */
function pickAll({ screen }: Mounted) {
  act(() => screen().pick('name', SUNITA_ID));
  act(() => screen().pick('city', VINAYAK_ID));
  act(() => screen().pick('primary_contact', VINAYAK_ID));
}

const refused = (status: number, code: string) => ({ status, body: refusal(code) });

describe('the merge waits for an explicit pick on every differing field (M02-60)', () => {
  it.each([
    [[], ['name', 'city', 'primary_contact'], false],
    [['name'], ['city', 'primary_contact'], false],
    [['name', 'city'], ['primary_contact'], false],
    [['name', 'city', 'primary_contact'], [], true],
  ] as const)('picks %j leave %j unpicked, the act awake: %s', async (fields, left, awake) => {
    const merge = await mounted();
    await compared(merge);
    for (const field of fields) act(() => merge.screen().pick(field, SUNITA_ID));
    const { read } = merge.screen();
    expect(read.kind === 'ready' ? read.value.unpicked : null).toEqual(left);
    expect(merge.screen().canMerge).toBe(awake);
  });

  it('a press while picks wait sends nothing', async () => {
    const merge = await mounted();
    await compared(merge);
    act(() => merge.screen().merge());
    act(() => merge.screen().review());
    expect([mergesSent(), merge.screen().step]).toEqual([[], 'choose']);
  });

  it('sends each pick as the side it was taken from, and lands done on the survivor’s lead', async () => {
    const merge = await mounted();
    await compared(merge);
    pickAll(merge);
    act(() => merge.screen().review());
    expect(merge.screen().step).toBe('confirm');
    act(() => merge.screen().merge());
    await waitFor(() => expect(merge.screen().done?.leadId).toBe(SURVIVOR_LEAD_ID));
    expect(origin.bodies).toEqual([
      {
        survivorId: SUNITA_ID,
        loserId: VINAYAK_ID,
        picks: { name: 'survivor', city: 'loser', primary_contact: 'loser' },
        capturedAt: expect.any(String),
      },
    ]);
    act(() => merge.screen().openCustomer());
    expect(merge.opened).toEqual([`leads/${SURVIVOR_LEAD_ID}`]);
  });

  it('making the other record stay keeps every pick on its record', async () => {
    const merge = await mounted();
    await compared(merge);
    pickAll(merge);
    act(() => merge.screen().stay(VINAYAK_ID));
    await waitFor(() => {
      const { read } = merge.screen();
      expect(read.kind === 'ready' ? read.value.survivor.customerId : null).toBe(VINAYAK_ID);
    });
    act(() => merge.screen().merge());
    await waitFor(() => expect(mergesSent()).toHaveLength(1));
    expect(origin.bodies[0]).toMatchObject({
      survivorId: VINAYAK_ID,
      loserId: SUNITA_ID,
      picks: { name: 'loser', city: 'survivor', primary_contact: 'survivor' },
    });
  });
});

describe('a pair that cannot merge here is unavailable, with its reason (M02-63)', () => {
  it.each([
    [
      'outside the list',
      { status: 200, body: BLOCKED_OUTSIDE },
      { kind: 'out_of_scope', heldBy: 'Rajesh Jadhav' },
    ],
    [
      'already merged',
      { status: 200, body: { ...BLOCKED_OUTSIDE, blocked: 'already_merged', heldBy: null } },
      { kind: 'already_merged' },
    ],
    ['gone', refused(404, 'NOT_FOUND'), { kind: 'not_found' }],
  ] as const)('%s', async (_case, answer, unavailable) => {
    origin.preview = answer;
    const merge = await mounted();
    await waitFor(() => expect(merge.screen().read).toEqual({ kind: 'unavailable', unavailable }));
    act(() => merge.screen().merge());
    expect([mergesSent(), merge.screen().canMerge]).toEqual([[], false]);
  });

  it('a reader without the grant reads nothing', async () => {
    origin.roles = NO_MERGE;
    const merge = await mounted();
    expect(merge.screen().allowed).toBe(false);
    expect(origin.sent).toEqual([]);
  });
});

describe('the merge while it is out, and how it comes back', () => {
  it('waits inert: a second press, a pick, a swap and the way back send and change nothing', async () => {
    let release = () => {};
    origin.gate = new Promise((resolve) => {
      release = resolve;
    });
    const merge = await mounted();
    await compared(merge);
    pickAll(merge);
    act(() => merge.screen().review());
    act(() => {
      merge.screen().merge();
      merge.screen().merge();
    });
    await waitFor(() => expect(merge.screen().merging).toBe(true));
    expect(merge.screen().isMerging()).toBe(true);
    act(() => merge.screen().pick('name', VINAYAK_ID));
    act(() => merge.screen().stay(VINAYAK_ID));
    act(() => merge.screen().backToChoices());
    const { read } = merge.screen();
    expect(read.kind === 'ready' ? read.value.kept[0]?.value : null).toBe('Sunita Kulkarni');
    expect(merge.screen().step).toBe('confirm');
    release();
    await waitFor(() => expect(merge.screen().done).not.toBe(null));
    expect(mergesSent()).toHaveLength(1);
  });

  it.each([
    ['out of scope', refused(409, 'MERGE_OUT_OF_SCOPE'), 'out_of_scope'],
    ['already merged', refused(409, 'CUSTOMER_ALREADY_MERGED'), 'already_merged'],
    ['gone', refused(404, 'NOT_FOUND'), 'not_found'],
  ] as const)(
    'refused %s: said in place, nothing done, the act asleep',
    async (_case, answer, why) => {
      origin.merges = [answer];
      const merge = await mounted();
      await compared(merge);
      pickAll(merge);
      act(() => merge.screen().merge());
      await waitFor(() =>
        expect(merge.screen().failure).toEqual({ kind: 'refused', refusal: why }),
      );
      expect([merge.screen().done, merge.screen().canMerge]).toEqual([null, false]);
    },
  );

  it('records that changed under the picks are read again, back at the choices', async () => {
    origin.merges = [
      {
        status: 422,
        body: {
          error: { ...refusal('MERGE_CHOICES_MISSING').error, facts: { unpicked: ['city'] } },
        },
      },
    ];
    const merge = await mounted();
    await compared(merge);
    pickAll(merge);
    act(() => merge.screen().review());
    const reads = origin.sent.length;
    act(() => merge.screen().merge());
    await waitFor(() =>
      expect(merge.screen().failure).toEqual({ kind: 'refused', refusal: 'choices_missing' }),
    );
    expect(merge.screen().step).toBe('choose');
    await waitFor(() => expect(origin.sent.length).toBeGreaterThan(reads + 1));
  });

  it('no answer says so, and the same merge may be pressed again', async () => {
    origin.merges = ['drop'];
    const merge = await mounted();
    await compared(merge);
    pickAll(merge);
    act(() => merge.screen().merge());
    await waitFor(() => expect(merge.screen().failure?.kind).toBe('failed'));
    expect(merge.screen().canMerge).toBe(true);
    act(() => merge.screen().merge());
    await waitFor(() => expect(merge.screen().done).not.toBe(null));
    expect(mergesSent()).toHaveLength(2);
  });
});

describe('finding the other record', () => {
  it('opens on the search, never offers the record that stays, and a pick compares the two', async () => {
    const merge = await mounted(null);
    expect([merge.screen().step, merge.screen().find.read]).toEqual(['find', { kind: 'idle' }]);
    act(() => merge.screen().find.setQuery('Kulkarni'));
    await waitFor(() => expect(merge.screen().find.read.kind).toBe('ready'));
    const { read } = merge.screen().find;
    expect(read.kind === 'ready' ? read.value.map((one) => one.id) : null).toEqual([VINAYAK_ID]);
    act(() => merge.screen().find.pick(VINAYAK_ID));
    await compared(merge);
    expect([merge.screen().step, merge.screen().canChangeOther]).toEqual(['choose', true]);
    act(() => merge.screen().changeOther());
    expect(merge.screen().step).toBe('find');
  });

  it('a pair the screen opened with offers no other record', async () => {
    const merge = await mounted();
    await compared(merge);
    expect(merge.screen().canChangeOther).toBe(false);
  });
});
