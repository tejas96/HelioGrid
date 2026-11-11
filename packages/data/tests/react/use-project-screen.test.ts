// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PickedFile } from '../../src/react/picked-file';
import { type FilePlace, useProjectScreen } from '../../src/react/use-project-screen';
import { refusal } from './origin-wire';
import { CREW_ID, FILE_ID, PROJECT_ID } from './projects-fixtures';
import {
  actRefused,
  answerNext,
  holdWrites,
  mountedOver,
  origin,
  settle,
  writesSent,
} from './projects-origin';

/**
 * One project (`SCR-M08-02`…`04`) through the real client: the read and domain's view, each act's
 * route and body, the toast it leaves with its *Undo*, a refusal said in its sheet, one send at a
 * time, and a picked file stored then put in its place.
 */

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

describe('Project — the read', () => {
  it('the project with domain’s view: its days, the one next step, the rows waiting', async () => {
    const { read } = (await mountedProject()).result.current;
    if (read.kind !== 'ready') throw new Error(`the project is ${read.kind}`);
    expect(read.value.project.number).toBe('PRJ-0042');
    expect(read.value.view.days).toBe(6);
    expect(read.value.view.next).toEqual({ kind: 'move', to: 'material_ordered' });
    expect(read.value.view.documentsWaiting).toEqual(['utility_feasibility']);
  });

  it('a project out of the reader’s scope reads unavailable, never a failure to retry', async () => {
    origin.gone = true;
    const view = await mountedProject();
    expect(view.result.current.read).toEqual({ kind: 'unavailable' });
  });
});

describe('Project — acts and their answers', () => {
  it('a move is sent, lands, and leaves a toast its Undo takes back', async () => {
    const view = await mountedProject();
    act(() => view.result.current.send({ kind: 'move', to: 'material_ordered' }));
    await waitFor(() =>
      expect(view.result.current.toast).toEqual({
        kind: 'moved',
        stage: 'material_ordered',
        undoable: true,
      }),
    );
    expect(stageOf(view)).toBe('material_ordered');
    expect(view.result.current.sheet).toBeNull();

    act(() => view.result.current.undo());
    expect(view.result.current.toast).toBeNull();
    await waitFor(() => expect(view.result.current.toast).toEqual({ kind: 'undone' }));
    expect(stageOf(view)).toBe('won');
    expect(origin.writes.map(({ path, body }) => [path, body])).toEqual([
      [`/projects/${PROJECT_ID}/move`, { to: 'material_ordered', capturedAt: expect.any(String) }],
      [`/projects/${PROJECT_ID}/undo`, { capturedAt: expect.any(String) }],
    ]);
  });

  it('Dispatched from its sheet names the crew, and the sheet closes on the answer', async () => {
    const view = await mountedProject();
    act(() => view.result.current.open({ kind: 'dispatch' }));
    act(() =>
      view.result.current.send({ kind: 'dispatch', crew: [CREW_ID], leftOn: '2026-11-09' }),
    );
    await waitFor(() => expect(view.result.current.sheet).toBeNull());
    expect(origin.writes[0]?.body).toEqual({
      crew: [CREW_ID],
      leftOn: '2026-11-09',
      capturedAt: expect.any(String),
    });
    expect(view.result.current.toast).toMatchObject({ kind: 'moved', stage: 'dispatched' });
  });

  it('a wait is sent as who, why, since when and the note, and its toast says so', async () => {
    const view = await mountedProject();
    act(() => view.result.current.open({ kind: 'wait' }));
    act(() =>
      view.result.current.send({
        kind: 'startWait',
        party: 'customer',
        reason: 'customer_documents',
        startedOn: '2026-11-09',
        note: null,
      }),
    );
    await waitFor(() => expect(view.result.current.sheet).toBeNull());
    expect(origin.writes).toEqual([
      {
        path: `/projects/${PROJECT_ID}/wait`,
        body: {
          party: 'customer',
          reason: 'customer_documents',
          startedOn: '2026-11-09',
          note: null,
          capturedAt: expect.any(String),
        },
        key: '',
      },
    ]);
    expect(view.result.current.toast).toEqual({
      kind: 'waitSaved',
      party: 'customer',
      date: '2026-11-09',
    });
  });

  it('a refused act says domain’s reason in its sheet, which stays until closed', async () => {
    const view = await mountedProject();
    answerNext('wait', { status: 422, body: actRefused('wait_open') });
    act(() => view.result.current.open({ kind: 'wait' }));
    act(() =>
      view.result.current.send({
        kind: 'startWait',
        party: 'company',
        reason: 'crew_availability',
        startedOn: '2026-11-09',
        note: 'Crew on another roof',
      }),
    );
    await waitFor(() => expect(view.result.current.refusal).toBe('wait_open'));
    expect(view.result.current.sheet).toEqual({ kind: 'wait' });
    expect(view.result.current.failed).toBe(false);
    expect(view.result.current.toast).toBeNull();
    act(() => view.result.current.close());
    expect(view.result.current.sheet).toBeNull();
    expect(view.result.current.refusal).toBeNull();
  });

  it('a failure that is no refusal is told apart from one', async () => {
    const view = await mountedProject();
    answerNext('move', { status: 500, body: refusal('INTERNAL') });
    act(() => view.result.current.send({ kind: 'move', to: 'material_ordered' }));
    await waitFor(() => expect(view.result.current.failed).toBe(true));
    expect(view.result.current.refusal).toBeNull();
    expect(stageOf(view)).toBe('won');
  });

  it('while a send is out its sheet waits, a second send goes nowhere, and success closes it', async () => {
    const view = await mountedProject();
    const release = holdWrites();
    act(() => view.result.current.open({ kind: 'cancel' }));
    act(() =>
      view.result.current.send({ kind: 'cancel', reason: 'something_else', note: 'Moved city' }),
    );
    await waitFor(() => expect(view.result.current.sending).toBe(true));
    act(() => view.result.current.send({ kind: 'cancel', reason: 'won_by_mistake', note: null }));
    act(() => view.result.current.close());
    act(() => view.result.current.open({ kind: 'date' }));
    expect(view.result.current.sheet).toEqual({ kind: 'cancel' });
    release();
    await waitFor(() => expect(view.result.current.sheet).toBeNull());
    expect(origin.writes).toHaveLength(1);
    expect(view.result.current.toast).toEqual({ kind: 'cancelled' });
  });
});

describe('Project — a picked file put in its place', () => {
  const PHOTO: PickedFile = {
    bytes: new Uint8Array([1, 2, 3, 4]),
    name: 'Feasibility letter',
    contentType: 'image/jpeg',
  };

  it('a row’s document is declared, stored, completed, then attached', async () => {
    const place: FilePlace = { slot: 'document', slotKey: 'utility_feasibility' };
    const view = await mountedProject();
    act(() => view.result.current.upload(PHOTO, place));
    expect(view.result.current.uploading).toEqual(place);
    await waitFor(() =>
      expect(view.result.current.toast).toEqual({
        kind: 'documentDone',
        row: 'utility_feasibility',
      }),
    );
    expect(writesSent()).toEqual([
      'POST /files',
      `PUT /store/${FILE_ID}`,
      `POST /files/${FILE_ID}/complete`,
      `POST /projects/${PROJECT_ID}/files`,
    ]);
    expect(origin.writes[0]?.body).toMatchObject({
      subjectKind: 'project',
      subjectRef: PROJECT_ID,
      contentType: 'image/jpeg',
      byteSize: 4,
    });
    expect(origin.writes.at(-1)?.body).toEqual({
      fileId: FILE_ID,
      ...place,
      name: 'Feasibility letter',
      capturedAt: expect.any(String),
    });
    expect(view.result.current.uploading).toBeNull();
    expect(view.result.current.uploadFailed).toBeNull();
  });

  it('an other file asks its name first, sends nothing until named, then goes up under it', async () => {
    const view = await mountedProject();
    act(() => view.result.current.upload(PHOTO, { slot: 'other', slotKey: null }));
    expect(view.result.current.sheet).toEqual({ kind: 'file' });
    expect(view.result.current.naming).toEqual({ name: 'Feasibility letter' });
    await settle();
    expect(writesSent()).toEqual([]);
    act(() => view.result.current.nameFile('Roof before work'));
    await waitFor(() => expect(view.result.current.toast).toEqual({ kind: 'saved' }));
    expect(origin.writes.at(-1)?.body).toMatchObject({
      slot: 'other',
      slotKey: null,
      name: 'Roof before work',
    });
    expect(view.result.current.sheet).toBeNull();
    expect(view.result.current.naming).toBeNull();
  });

  it('a named file that did not go up says so in its open sheet, busy while out, and goes up when named again', async () => {
    const view = await mountedProject();
    act(() => view.result.current.upload(PHOTO, { slot: 'other', slotKey: null }));
    answerNext('complete', { status: 503, body: refusal('OBJECT_STORE_UNAVAILABLE') });
    const release = holdWrites();
    act(() => view.result.current.nameFile('Roof before work'));
    await waitFor(() => expect(view.result.current.sending).toBe(true));
    release();
    await waitFor(() => expect(view.result.current.failed).toBe(true));
    expect(view.result.current.sending).toBe(false);
    expect(view.result.current.sheet).toEqual({ kind: 'file' });
    act(() => view.result.current.nameFile('Roof before work'));
    await waitFor(() => expect(view.result.current.toast).toEqual({ kind: 'saved' }));
    expect(view.result.current.failed).toBe(false);
    expect(view.result.current.sheet).toBeNull();
  });

  it('a file that did not reach the project goes up again on Retry', async () => {
    const view = await mountedProject();
    const place: FilePlace = { slot: 'step', slotKey: 'mounting' };
    answerNext('complete', { status: 503, body: refusal('OBJECT_STORE_UNAVAILABLE') });
    act(() => view.result.current.upload(PHOTO, place));
    await waitFor(() => expect(view.result.current.uploadFailed).toEqual(place));
    act(() => view.result.current.retryUpload());
    await waitFor(() => expect(view.result.current.toast).toEqual({ kind: 'saved' }));
    expect(view.result.current.uploadFailed).toBeNull();
    expect(
      writesSent().filter((write) => write === `POST /projects/${PROJECT_ID}/files`),
    ).toHaveLength(1);
  });

  it('a store that keeps the bytes unconfirmed puts nothing on the project', async () => {
    const view = await mountedProject();
    const place: FilePlace = { slot: 'document', slotKey: 'utility_feasibility' };
    answerNext('complete', { status: 503, body: refusal('OBJECT_STORE_UNAVAILABLE') });
    act(() => view.result.current.upload(PHOTO, place));
    await waitFor(() => expect(view.result.current.uploadFailed).toEqual(place));
    expect(view.result.current.uploading).toBeNull();
    expect(writesSent()).not.toContain(`POST /projects/${PROJECT_ID}/files`);
    expect(view.result.current.toast).toBeNull();
  });
});
