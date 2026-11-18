// @vitest-environment happy-dom

import type { LeadDetail } from '@heliogrid/contracts';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLeadDesignsSection } from '../../src/react/use-lead-designs-section';
import {
  aDesign,
  answerNext,
  DESIGNS_ROLE,
  designId,
  holdWrites,
  LEAD_ID,
  mountedOver,
  origin,
  READS_ONLY_ROLE,
  readsOf,
  settle,
} from './studio-origin';

/**
 * The lead's Designs section (`T-M05-001`) through the real client: read once the section is in
 * view, a design made and its Site details opened, one act at a time, a retry that makes no
 * second design, and the recommended mark drawn from the act's own answer.
 */

const DESIGNS_PATH = `/leads/${LEAD_ID}/designs`;

function mounted(shown = true, lead: LeadDetail | null = null) {
  const moved: string[] = [];
  const moves = {
    toSiteDetails: (id: string) => moved.push(`site ${id}`),
    toDesign: (id: string) => moved.push(`design ${id}`),
  };
  const view = mountedOver(
    (props: { shown: boolean }) => useLeadDesignsSection(LEAD_ID, lead, props.shown, moves),
    { shown },
  );
  return { view, moved };
}

async function mountedRead() {
  const world = mounted();
  await waitFor(() => expect(world.view.result.current.read.kind).not.toBe('loading'));
  return world;
}

type World = Awaited<ReturnType<typeof mountedRead>>;
const ordinalsOf = ({ view }: World) => {
  const { read } = view.result.current;
  return read.kind === 'ready' ? read.value.map((one) => one.ordinal) : read.kind;
};
const recommendedOf = ({ view }: World) => {
  const { read } = view.result.current;
  return read.kind === 'ready'
    ? read.value.filter((one) => one.recommended).map((one) => one.id)
    : [];
};
const createsSent = () => origin.writes.filter((write) => write.path === DESIGNS_PATH);

describe('Lead designs — the read', () => {
  it('is not asked for until the section is in view', async () => {
    const { view } = mounted(false);
    await settle();
    expect(readsOf(DESIGNS_PATH)).toBe(0);
    view.rerender({ shown: true });
    await waitFor(() => expect(view.result.current.read.kind).toBe('empty'));
    expect(readsOf(DESIGNS_PATH)).toBe(1);
  });

  it('none yet reads empty; designs read newest first', async () => {
    expect((await mountedRead()).view.result.current.read.kind).toBe('empty');
    origin.designs = [aDesign(1), aDesign(2)];
    expect(ordinalsOf(await mountedRead())).toEqual([2, 1]);
  });

  it.each([
    ['may design', DESIGNS_ROLE, true],
    ['reads only', READS_ONLY_ROLE, false],
  ] as const)('a reader who %s is told so', async (_, role, canDesign) => {
    origin.roles = [role];
    const { view } = await mountedRead();
    await waitFor(() => expect(view.result.current.canDesign).toBe(canDesign));
  });

  it('a lost lead is closed to new designs', async () => {
    const lost = { lead: { state: 'lost' } } as unknown as LeadDetail;
    expect(mounted(true, lost).view.result.current.closed).toBe(true);
    expect(mounted(true, null).view.result.current.closed).toBe(false);
  });
});

describe('Lead designs — Create design', () => {
  it('makes the lead’s next design, opens its Site details and reads the list again', async () => {
    origin.designs = [aDesign(1)];
    const world = await mountedRead();
    act(() => world.view.result.current.create());
    await waitFor(() => expect(world.moved).toEqual([`site ${designId(2)}`]));
    expect(createsSent().map((write) => write.body)).toEqual([
      { copyOf: null, capturedAt: expect.any(String) },
    ]);
    await waitFor(() => expect(ordinalsOf(world)).toEqual([2, 1]));
    expect(world.view.result.current.failure).toBeNull();
  });

  it('works from the dock while the section is out of view', async () => {
    const world = mounted(false);
    await settle();
    act(() => world.view.result.current.create());
    await waitFor(() => expect(world.moved).toEqual([`site ${designId(1)}`]));
  });

  it('a second press while the first is out sends nothing', async () => {
    const world = await mountedRead();
    const release = holdWrites();
    act(() => world.view.result.current.create());
    await waitFor(() => expect(world.view.result.current.busy).toBe(true));
    act(() => world.view.result.current.create());
    act(() => world.view.result.current.copy(designId(1)));
    release();
    await waitFor(() => expect(world.view.result.current.busy).toBe(false));
    expect(createsSent()).toHaveLength(1);
  });

  it('a dropped answer says so, and the same press again makes no second design', async () => {
    const world = await mountedRead();
    answerNext('create', 'drop');
    act(() => world.view.result.current.create());
    await waitFor(() => expect(world.view.result.current.failure).toBe('other'));
    expect(world.moved).toEqual([]);
    act(() => world.view.result.current.create());
    await waitFor(() => expect(world.moved).toEqual([`site ${designId(1)}`]));
    const [first, second] = createsSent();
    expect(second?.key).toBe(first?.key);
    expect(second?.body).toEqual(first?.body);
    expect(world.view.result.current.failure).toBeNull();
  });

  it('a lead closed meanwhile refuses with its own reason', async () => {
    const world = await mountedRead();
    answerNext('create', {
      status: 422,
      body: {
        error: {
          code: 'DESIGN_ACT_REFUSED',
          message: 'refused',
          requestId: 'test',
          facts: { refusal: 'host_closed' },
        },
      },
    });
    act(() => world.view.result.current.create());
    await waitFor(() => expect(world.view.result.current.failure).toBe('host_closed'));
    expect(world.moved).toEqual([]);
  });

  it('tells the dock of Create design alone: a failed copy is the section’s, not the dock’s', async () => {
    origin.designs = [aDesign(1)];
    const world = await mountedRead();
    answerNext('create', 'drop');
    act(() => world.view.result.current.create());
    await waitFor(() => expect(world.view.result.current.createFailure).toBe('other'));
    answerNext('create', 'drop');
    act(() => world.view.result.current.copy(designId(1)));
    await waitFor(() => expect(world.view.result.current.failure).toBe('other'));
    expect(world.view.result.current.createFailure).toBeNull();
    expect(world.view.result.current.creating).toBe(false);
  });

  it('a copy names its source', async () => {
    origin.designs = [aDesign(1, { mount: 'ground' })];
    const world = await mountedRead();
    act(() => world.view.result.current.copy(designId(1)));
    await waitFor(() => expect(world.moved).toEqual([`site ${designId(2)}`]));
    expect(createsSent()[0]?.body).toMatchObject({ copyOf: designId(1) });
  });
});

describe('Lead designs — open and recommend', () => {
  it('opens a design on its own page', async () => {
    origin.designs = [aDesign(1)];
    const world = await mountedRead();
    act(() => world.view.result.current.open(designId(1)));
    expect(world.moved).toEqual([`design ${designId(1)}`]);
  });

  it('draws the mark from the act’s own answer, with no second read', async () => {
    origin.designs = [aDesign(1, { recommended: true }), aDesign(2)];
    const world = await mountedRead();
    act(() => world.view.result.current.recommend(designId(2), true));
    await waitFor(() => expect(recommendedOf(world)).toEqual([designId(2)]));
    expect(readsOf(DESIGNS_PATH)).toBe(1);
    act(() => world.view.result.current.recommend(designId(2), false));
    await waitFor(() => expect(recommendedOf(world)).toEqual([]));
  });

  it('a mark that came back undone says so and changes nothing', async () => {
    origin.designs = [aDesign(1)];
    const world = await mountedRead();
    answerNext('recommend', 'drop');
    act(() => world.view.result.current.recommend(designId(1), true));
    await waitFor(() => expect(world.view.result.current.failure).toBe('other'));
    expect(recommendedOf(world)).toEqual([]);
  });
});
