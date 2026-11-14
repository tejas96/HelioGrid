// @vitest-environment happy-dom
import { IN_FORMATS } from '@heliogrid/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  CALL_SOON,
  callSlotsFrom,
  useCustomerPageScreen,
} from '../../src/react/use-customer-page-screen';
import { SERVED_VERSION_ID } from './proposals-fixtures';
import { provided, sell, TOKEN } from './proposals-origin';

/**
 * The customer's page as its screen draws it (`SCR-F5-01`): the one sheet that is open, what the
 * customer typed in it, and the act that sheet sends — through the real client, so what reaches
 * the server is what the route's contract takes.
 */

const answers = (path: string) => sell.sent.filter((write) => write.path.endsWith(path));

async function mounted() {
  sell.signedIn = false;
  const view = renderHook(
    () => useCustomerPageScreen(TOKEN, { deviceClass: 'phone', formats: IN_FORMATS }),
    { wrapper: provided() },
  );
  await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
  return view;
}

describe('the customer page’s sheets', () => {
  it('the proposal reaches the page as the document’s parts take it, in the reader’s language', async () => {
    const view = await mounted();
    const { snapshot, language, categories } = view.result.current;
    expect(language).toBe('en');
    expect(snapshot?.money.payable).toBeGreaterThan(0);
    expect(snapshot?.money.figures.payable.tier).toBe('assumed');
    expect(categories).toContain('panel');
  });

  it('a question with no words cannot be sent; with words it is sent trimmed and its sheet closes', async () => {
    const view = await mounted();
    act(() => view.result.current.open('ask'));
    expect(view.result.current.canSend).toBe(false);

    act(() => view.result.current.typed('  Is the structure rust-proof?  '));
    expect(view.result.current.canSend).toBe(true);
    act(() => view.result.current.send());

    await waitFor(() => expect(answers('/questions')).toHaveLength(1));
    expect(answers('/questions')[0]?.body).toEqual({ text: 'Is the structure rust-proof?' });
    await waitFor(() => expect(view.result.current.sheet).toBeNull());
    expect(view.result.current.text).toBe('');
  });

  it('Accept names the version the customer was reading', async () => {
    const view = await mounted();
    act(() => view.result.current.open('accept'));
    act(() => view.result.current.send());

    await waitFor(() => expect(answers('/accept')).toHaveLength(1));
    expect(answers('/accept')[0]?.body).toEqual({ versionId: SERVED_VERSION_ID });
  });

  it('a decline may carry no reason: an untouched sheet sends null', async () => {
    const view = await mounted();
    act(() => view.result.current.open('decline'));
    expect(view.result.current.canSend).toBe(true);
    act(() => view.result.current.send());

    await waitFor(() => expect(answers('/decline')).toHaveLength(1));
    expect(answers('/decline')[0]?.body).toEqual({ versionId: SERVED_VERSION_ID, reason: null });
  });

  it('a call offers its first window; "as soon as possible" sends no time', async () => {
    const view = await mounted();
    act(() => view.result.current.open('call'));
    expect(view.result.current.slot).toBe(view.result.current.slots[0]?.at);

    act(() => view.result.current.choose(CALL_SOON));
    act(() => view.result.current.send());

    await waitFor(() => expect(answers('/call-requests')).toHaveLength(1));
    expect(answers('/call-requests')[0]?.body).toEqual({ at: null });
  });
});

describe('callSlotsFrom — the windows a customer may ask to be called in', () => {
  const at = (hour: number) => new Date(2026, 10, 13, hour, 0, 0, 0).getTime();

  it.each([
    ['in the morning, this evening is still ahead', at(9), ['today', 'tomorrow', 'tomorrow']],
    ['a minute before the evening window', at(18) - 60_000, ['today', 'tomorrow', 'tomorrow']],
    ['once the evening window has begun, only tomorrow', at(18), ['tomorrow', 'tomorrow']],
    ['late at night, only tomorrow', at(23), ['tomorrow', 'tomorrow']],
  ])('%s', (_, now, days) => {
    const slots = callSlotsFrom(now);
    expect(slots.map((slot) => slot.day)).toEqual(days);
    for (const slot of slots) expect(Date.parse(slot.at)).toBeGreaterThan(now);
  });
});
