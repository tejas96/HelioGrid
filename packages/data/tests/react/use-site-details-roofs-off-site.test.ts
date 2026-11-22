// @vitest-environment happy-dom

import { IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSiteDetailsScreen } from '../../src/react/use-site-details-screen';
import { aDesign, answerNext, designId, mountedOver, origin, SANGLI } from './studio-origin';

/**
 * Site details when the pin moved to another site (`roofs_off_site`), through the real client: the
 * save that would leave the drawn roofs behind asks first, Keep sends nothing more, and Move and
 * remove roofs sends the same site again with the roofs let go.
 */

const MARKET = { formats: IN_FORMATS, language: 'en' } as const;
const SITE_PATH = `/designs/${designId(1)}/site`;
const sitesSent = () => origin.writes.filter((write) => write.path === SITE_PATH);

async function located() {
  origin.designs = [aDesign(1)];
  const moved: string[] = [];
  const view = mountedOver(() =>
    useSiteDetailsScreen(designId(1), MARKET, { toDesign: (to) => moved.push(to) }),
  );
  await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
  act(() => view.result.current.acts.paste('16.8367, 74.5966'));
  await waitFor(() => {
    const { read } = view.result.current;
    expect(read.kind === 'ready' && read.value.form.address).toBe(SANGLI.address);
  });
  return { view, moved };
}

describe('Site details — a pin moved to another site', () => {
  const roofsLeftBehind = () =>
    answerNext('site', {
      status: 422,
      body: {
        error: {
          code: 'DESIGN_ACT_REFUSED',
          message: 'refused',
          requestId: 'test',
          facts: { refusal: 'roofs_off_site' },
        },
      },
    });

  it('a pin moved to another site asks before the roofs go; Keep sends nothing more', async () => {
    const world = await located();
    roofsLeftBehind();
    act(() => world.view.result.current.start());
    await waitFor(() => expect(world.view.result.current.roofsOffSite.asking).toBe(true));
    expect(world.view.result.current.failure).toBeNull();
    act(() => world.view.result.current.roofsOffSite.keep());
    expect(world.view.result.current.roofsOffSite.asking).toBe(false);
    expect(sitesSent()).toHaveLength(1);
    expect(world.moved).toEqual([]);
  });

  it('Move and remove roofs sends the same site again, the roofs let go, and opens the design', async () => {
    const world = await located();
    roofsLeftBehind();
    act(() => world.view.result.current.start());
    await waitFor(() => expect(world.view.result.current.roofsOffSite.asking).toBe(true));
    act(() => world.view.result.current.roofsOffSite.remove());
    await waitFor(() => expect(world.moved).toEqual([designId(1)]));
    expect(world.view.result.current.roofsOffSite.asking).toBe(false);
    const [first, again] = sitesSent().map((write) => write.body as Record<string, unknown>);
    // Each send is its own moment: only when it was sent differs, besides the roofs let go.
    const { capturedAt: _first, ...asked } = first ?? {};
    const { capturedAt: _again, ...agreed } = again ?? {};
    expect(asked).not.toHaveProperty('removeRoofs');
    expect(agreed).toEqual({ ...asked, removeRoofs: true });
  });
});
