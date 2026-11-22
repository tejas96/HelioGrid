// @vitest-environment happy-dom

import { IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSession } from '../../src/react/use-session';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { answerNext, designId, mountedOver, origin } from './studio-origin';

/**
 * The studio's magnet (`T-M05-002`, part b) through the real client: one switch, on by default,
 * that moves at once and is saved to the person's account in the shape older studios read — every
 * helper off; two quick taps end where they began; a save the server refuses is told.
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

describe('the magnet: one switch saved to the account', () => {
  it('a tap turns it off at once, and the account keeps every helper off', async () => {
    const view = await mounted();
    expect(view.result.current.studio.magnet).toBe(true);
    act(() => view.result.current.studio.moves.toggleMagnet());
    expect(view.result.current.studio.magnet).toBe(false);
    await waitFor(() => expect(helpersSent()).toEqual([['square', 'line_up', 'buildings']]));
    expect(view.result.current.studio.magnetRefused).toBe(false);
  });

  it('two quick taps end where they began: the second flips from the first', async () => {
    const view = await mounted();
    act(() => {
      view.result.current.studio.moves.toggleMagnet();
      view.result.current.studio.moves.toggleMagnet();
    });
    await waitFor(() => expect(helpersSent()).toEqual([['square', 'line_up', 'buildings'], []]));
    expect(view.result.current.studio.magnet).toBe(true);
  });

  it('a save the server refuses is told at the switch, and sent again on retry', async () => {
    answerNext('me', { status: 500, body: { error: { code: 'INTERNAL', message: 'down' } } });
    const view = await mounted();
    act(() => view.result.current.studio.moves.toggleMagnet());
    await waitFor(() => expect(view.result.current.studio.magnetRefused).toBe(true));
    act(() => view.result.current.studio.moves.retryMagnet());
    await waitFor(() => expect(view.result.current.studio.magnetRefused).toBe(false));
    const off = ['square', 'line_up', 'buildings'];
    expect(helpersSent()).toEqual([off, off]);
  });
});
