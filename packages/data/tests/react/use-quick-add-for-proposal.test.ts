// @vitest-environment happy-dom
import { IN_FORMATS, type QuickAddDone } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type QuickAddOptions, useQuickAddScreen } from '../../src/react/use-quick-add-screen';
import { useSession } from '../../src/react/use-session';
import {
  LEAD_ID,
  mountedOver,
  OUTSIDE,
  origin,
  PRIYA,
  TYPED,
  writesSent,
} from './quick-add-origin';

/**
 * *New proposal*'s "Who is it for?" (`M06-05`, `T-M06-001`): a number already a lead the person
 * reaches is that lead — *Use {name}* at once, no sheet over it and no second lead offered; a number
 * on a lead out of reach still opens the sheet with its own two answers.
 */

const done: QuickAddDone[] = [];

async function mounted(ownedByCapturer: boolean) {
  done.length = 0;
  const options: QuickAddOptions = {
    pack: IN_FORMATS,
    referredBy: null,
    ownedByCapturer,
    onClosed: () => undefined,
    onOpenLead: () => undefined,
    onDone: (answer) => done.push(answer),
  };
  const view = mountedOver(() => ({ session: useSession(), screen: useQuickAddScreen(options) }));
  await waitFor(() => expect(view.result.current.session.user?.tenant?.id).toBeTruthy());
  const screen = () => view.result.current.screen;
  act(() => screen().setPhone(TYPED));
  await waitFor(() => expect(screen().check.kind).toBe('known'));
  return screen;
}

describe('a known number in the New proposal flow (M06-05)', () => {
  it.each([
    ['a lead the person reaches, New proposal', PRIYA, true, null],
    ['a lead the person reaches, plain quick add', PRIYA, false, 'record'],
    ['a lead out of reach, New proposal', OUTSIDE, true, 'ask_owner'],
  ] as const)('%s', async (_, match, forProposal, sheet) => {
    origin.match = match;
    const screen = await mounted(forProposal);
    expect(screen().duplicate?.opens ?? null).toBe(sheet);
    expect(writesSent()).toEqual([]);
  });

  it('Save on a reachable number opens no sheet: the lead is used, not made again', async () => {
    origin.match = PRIYA;
    const screen = await mounted(true);
    act(() => screen().save());
    await waitFor(() => expect(done).toEqual([{ kind: 'saved', leadId: LEAD_ID }]));
    expect(screen().duplicate).toBe(null);
    expect(writesSent()).toEqual([]);
  });
});
