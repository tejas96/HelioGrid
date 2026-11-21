// @vitest-environment happy-dom

import { IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSession } from '../../src/react/use-session';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { answerNext, designId, mountedOver, origin } from './studio-origin';

/**
 * The studio's helper picks (`T-M05-002`, part b) through the real client: a switch moves at once
 * and is saved to the person's account; two quick taps end where they began, each sent from the
 * pick last asked for; a save the server refuses is told, never swallowed.
 */
async function mounted() {
  const view = mountedOver(() => ({
    session: useSession(),
    studio: useStudioScreen(designId(1), IN_FORMATS),
  }));
  await waitFor(() => expect(view.result.current.session.user).not.toBeNull());
  return view;
}

const helpersSent = () =>
  origin.writes
    .filter((write) => write.path === '/users/me')
    .map((write) => (write.body as { studioHelpersOff: string[] }).studioHelpersOff);

describe('the drawing helpers: each a switch saved to the account', () => {
  it('a tap on Square turns it off at once, and the account keeps it', async () => {
    const view = await mounted();
    act(() => view.result.current.studio.moves.toggleHelper('square'));
    expect(view.result.current.studio.helpers.square).toBe(false);
    await waitFor(() => expect(helpersSent()).toEqual([['square']]));
    expect(view.result.current.studio.helpersRefused).toBe(false);
  });

  it('two quick taps end where they began: the second flips from the first', async () => {
    const view = await mounted();
    act(() => {
      view.result.current.studio.moves.toggleHelper('square');
      view.result.current.studio.moves.toggleHelper('square');
    });
    await waitFor(() => expect(helpersSent()).toEqual([['square'], []]));
    expect(view.result.current.studio.helpers.square).toBe(true);
  });

  it('a save the server refuses is told at the switch', async () => {
    answerNext('me', { status: 500, body: { error: { code: 'INTERNAL', message: 'down' } } });
    const view = await mounted();
    act(() => view.result.current.studio.moves.toggleHelper('buildings'));
    await waitFor(() => expect(view.result.current.studio.helpersRefused).toBe(true));
    act(() => view.result.current.studio.moves.retryHelpers());
    await waitFor(() => expect(view.result.current.studio.helpersRefused).toBe(false));
    expect(helpersSent()).toEqual([['buildings'], ['buildings']]);
  });
});
