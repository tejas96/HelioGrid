// @vitest-environment happy-dom

import type { StudioDocumentWire } from '@heliogrid/contracts';
import { IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { stored } from './studio-document-origin';
import { aDesign, designId, mountedOver, origin } from './studio-origin';
import { aPlan } from './studio-picture-origin';

/**
 * A plan laid under the design, through the real client (`T-M05-002d`): picked, put down, hidden,
 * paged and re-sized, each act one save of the whole document.
 */
const PLAN_ID = '01a50000-0000-7000-8000-0000000000b1';
const PLAN: NonNullable<StudioDocumentWire['plan']> = {
  pictureId: PLAN_ID,
  at: { east: -6, north: -4 },
  turnDeg: 0,
  metresPerUnit: 0.001,
  scaleFrom: 'file',
  seeThrough: 80,
  locked: false,
  hidden: false,
  page: 1,
};

async function opened(plan: Partial<typeof PLAN> = {}, pages = 1) {
  origin.designs = [aDesign(1)];
  aPlan(PLAN_ID, pages);
  stored.document = { ...stored.document, plan: { ...PLAN, ...plan } };
  const view = mountedOver(() => useStudioScreen(designId(1), IN_FORMATS));
  await waitFor(() => expect(view.result.current.own.plan).not.toBeNull());
  await waitFor(() => expect(view.result.current.editing.kind).toBe('editor'));
  return view;
}

const lastPlan = () => stored.saves.at(-1)?.plan;

describe('a laid plan: picked, hidden, locked', () => {
  it('hiding a picked plan puts it down: no card, no handles, and the hide is saved', async () => {
    const view = await opened();
    act(() => view.result.current.ownMoves.pickPlan(true));
    expect(view.result.current.own.plan?.picked).toBe(true);
    act(() => view.result.current.ownMoves.hidePlan(true));
    await waitFor(() => expect(lastPlan()?.hidden).toBe(true));
    expect(view.result.current.own.plan?.picked).toBe(false);
    expect(view.result.current.own.cardOpen).toBe(false);
  });
});

describe('a plan laid at our guess, sized by its roof’s first length', () => {
  it('a roof tapped from its outline, then one length set: the plan is sized, the picture never', async () => {
    const view = await opened({ scaleFrom: 'guess' });
    act(() => {
      view.result.current.ownMoves.tapPlan({ east: 0, north: 0 });
    });
    await waitFor(() => expect(stored.saves.at(-1)?.roofs).toHaveLength(1));
    // At our guess the bar asks for one length; it never says the lengths are the plan's yet.
    expect(view.result.current.own.say).toBe('plan_to_size');
    // The site has no sky picture: Type the size opened by itself; it is put away first.
    act(() => view.result.current.moves.cancel());
    act(() => view.result.current.moves.pickLength(0, 0));
    act(() => view.result.current.moves.typeLength({ main: '9', inches: '', measured: false }));
    act(() => view.result.current.moves.setLength());
    await waitFor(() => expect(lastPlan()?.scaleFrom).toBe('person'));
    expect(lastPlan()?.metresPerUnit).toBeCloseTo(0.00075, 12);
    expect(stored.saves.at(-1)?.pictureScale).toBe(1);
    expect(stored.saves.at(-1)?.roofs[0]?.edges).toEqual(['typed', 'plan', 'plan', 'plan']);
    expect(view.result.current.own.say).not.toBe('plan_to_size');
  });
});
