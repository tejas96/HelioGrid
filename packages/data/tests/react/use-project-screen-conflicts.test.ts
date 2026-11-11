// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProjectScreen } from '../../src/react/use-project-screen';
import { AT, aProject, PROJECT_ID, READER, TODAY } from './projects-fixtures';
import { actRefused, answerNext, mountedOver, origin, settle, writesSent } from './projects-origin';

/**
 * One project when it is not where the person thinks (`SCR-M08-02`, ruling 16): an address that
 * names no project, a move another person made first — read again and named — and a proof that
 * came early, which asks in its own sheet before anything is sent.
 */

const SECOND = { userId: '01a60000-0000-7000-8000-000000000003', name: 'Rahul Jadhav' };

async function mountedProject() {
  const view = mountedOver(() => useProjectScreen(PROJECT_ID));
  await waitFor(() => expect(view.result.current.read.kind).not.toBe('loading'));
  return view;
}

type ProjectView = Awaited<ReturnType<typeof mountedProject>>;
function stageOf(view: ProjectView) {
  const { read } = view.result.current;
  return read.kind === 'ready' ? read.value.project.stage : read.kind;
}

function nextOf(view: ProjectView) {
  const { read } = view.result.current;
  return read.kind === 'ready' ? read.value.view.next.kind : read.kind;
}

describe('Project — an address that names no project', () => {
  it.each([
    ['not-an-id', 0],
    ['', 0],
  ])(
    'an address %j that names no project reads unavailable and reads nothing',
    async (id, reads) => {
      const view = mountedOver(() => useProjectScreen(id));
      expect(view.result.current.read).toEqual({ kind: 'unavailable' });
      await settle();
      expect(origin.sent.filter((sent) => sent.startsWith('GET /projects/'))).toHaveLength(reads);
    },
  );
});

describe('Project — a move made first, and a proof that came early', () => {
  it('a move another person made first reads the project again, and names who moved it', async () => {
    const view = await mountedProject();
    expect(view.result.current.lastMove).toEqual({ by: READER.name, stage: 'won' });
    const moved = aProject();
    origin.project = {
      ...moved,
      stage: 'material_ordered',
      journey: [
        ...moved.journey,
        {
          from: 'won',
          to: 'material_ordered',
          cause: 'person',
          proof: null,
          movedAt: AT,
          enteredOn: TODAY,
          movedBy: SECOND,
        },
      ],
    };
    answerNext('move', { status: 422, body: actRefused('already_moved') });
    act(() => view.result.current.send({ kind: 'move', to: 'material_ordered' }));
    await waitFor(() => expect(stageOf(view)).toBe('material_ordered'));
    expect(view.result.current.refusal).toBe('already_moved');
    expect(view.result.current.lastMove).toEqual({ by: SECOND.name, stage: 'material_ordered' });
  });

  it.each([
    ['already_moved', 2],
    ['step_ticked', 2],
    ['project_closed', 2],
  ] as const)('a refusal %s reads the project again (%i reads in all)', async (why, reads) => {
    const view = await mountedProject();
    answerNext('move', { status: 422, body: actRefused(why) });
    act(() => view.result.current.send({ kind: 'move', to: 'material_ordered' }));
    await waitFor(() => expect(view.result.current.refusal).toBe(why));
    await settle();
    expect(origin.sent.filter((sent) => sent === `GET /projects/${PROJECT_ID}`)).toHaveLength(
      reads,
    );
  });

  it.each([
    ['a sheet the person opens', { kind: 'dispatch' }],
    ['a sheet the next step opens', null],
  ] as const)('a refusal is not carried into %s', async (_, sheet) => {
    const view = await mountedProject();
    // The refusal reads the project again; this time a proof has come early, so its next step is a sheet.
    origin.project = { ...aProject(), todo: 'proof_early', earlyProofTo: 'material_ordered' };
    answerNext('move', { status: 422, body: actRefused('already_moved') });
    act(() => view.result.current.send({ kind: 'move', to: 'material_ordered' }));
    await waitFor(() => expect(view.result.current.refusal).toBe('already_moved'));
    await waitFor(() => expect(nextOf(view)).toBe('confirm_proof'));
    const { read } = view.result.current;
    if (read.kind !== 'ready') throw new Error(`the project is ${read.kind}`);
    act(() => {
      if (sheet === null) view.result.current.next(read.value.view.next);
      else view.result.current.open(sheet);
    });
    expect(view.result.current.sheet).not.toBeNull();
    expect(view.result.current.refusal).toBeNull();
  });

  it.each([
    [
      'still early',
      { todo: 'proof_early', earlyProofTo: 'material_ordered' },
      { kind: 'earlyProof' },
    ],
    ['confirmed since', {}, null],
  ] as const)(
    'opened from the board to ask about an early proof %s, the page asks in its sheet or not at all',
    async (_, asks, sheet) => {
      origin.project = { ...aProject(), ...asks };
      const view = mountedOver(() => useProjectScreen(PROJECT_ID, 'earlyProof'));
      await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
      expect(view.result.current.sheet).toEqual(sheet);
      expect(writesSent()).toEqual([]);
    },
  );

  it('a proof that came early opens its own sheet, and Move sends the confirm', async () => {
    origin.project = { ...aProject(), todo: 'proof_early', earlyProofTo: 'material_ordered' };
    const view = await mountedProject();
    const { read } = view.result.current;
    if (read.kind !== 'ready') throw new Error(`the project is ${read.kind}`);
    let answer: ReturnType<typeof view.result.current.next> = { kind: 'handover' };
    act(() => {
      answer = view.result.current.next(read.value.view.next);
    });
    expect(answer).toBeNull();
    expect(view.result.current.sheet).toEqual({ kind: 'earlyProof' });
    expect(writesSent()).toEqual([]);
    act(() => view.result.current.send({ kind: 'confirmProof', to: 'material_ordered' }));
    await waitFor(() => expect(view.result.current.sheet).toBeNull());
    expect(origin.writes[0]?.path).toBe(`/projects/${PROJECT_ID}/confirm-proof`);
  });
});
