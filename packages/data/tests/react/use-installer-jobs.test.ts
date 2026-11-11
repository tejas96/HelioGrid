// @vitest-environment happy-dom
import type { ProjectDetail } from '@heliogrid/contracts';
import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { PickedFile } from '../../src/react/picked-file';
import { useInstallerJobs } from '../../src/react/use-installer-jobs';
import type { FilePlace } from '../../src/react/use-project-screen';
import { refusal } from './origin-wire';
import { AT, aJob, aProject, FILE_ID, PROJECT_ID, READER } from './projects-fixtures';
import {
  answerNext,
  JOB_HOME_ROLE,
  mountedOver,
  NO_JOB_HOME_ROLE,
  origin,
  readsOf,
  settle,
  writesSent,
} from './projects-origin';

/**
 * The installer's job home (`SCR-M08-05`) through the real client: the jobs their crew is on, and
 * the one on screen — the one chosen while it is still theirs, else the first.
 */

const FIRST = aJob(1);
const SECOND = aJob(2);

async function mountedJobs() {
  const view = mountedOver(() => useInstallerJobs());
  await waitFor(() => expect(view.result.current.read.kind).not.toBe('loading'));
  return view;
}

describe('Installer jobs', () => {
  beforeEach(() => {
    origin.roles = [JOB_HOME_ROLE];
  });

  it('a home that is not the installer’s draws no job and reads none', async () => {
    origin.roles = [NO_JOB_HOME_ROLE];
    origin.jobs = [FIRST];
    const view = mountedOver(() => useInstallerJobs());
    await settle();
    expect(view.result.current.shown).toBe(false);
    expect(readsOf('/projects/jobs')).toBe(0);
  });

  it('the assigned jobs, the first on screen', async () => {
    expect(JOB_HOME_ROLE).not.toBe(NO_JOB_HOME_ROLE);
    origin.jobs = [FIRST, SECOND];
    const view = await mountedJobs();
    expect(view.result.current.read).toEqual({ kind: 'ready', value: [FIRST, SECOND] });
    expect(view.result.current.jobId).toBe(FIRST.id);
  });

  it('none dispatched to them reads empty, with no job on screen', async () => {
    const view = await mountedJobs();
    expect(view.result.current.read).toEqual({ kind: 'empty' });
    expect(view.result.current.jobId).toBeNull();
  });

  it.each([
    ['one of theirs', SECOND.id, SECOND.id],
    ['one no longer theirs', aJob(3).id, FIRST.id],
  ])('choosing %s shows %s', async (_, chosen, shown) => {
    origin.jobs = [FIRST, SECOND];
    const view = await mountedJobs();
    act(() => view.result.current.choose(chosen));
    expect(view.result.current.jobId).toBe(shown);
  });
});

describe('Installer jobs — Photo and tick', () => {
  const PHOTO: PickedFile = {
    bytes: new Uint8Array([1, 2, 3, 4]),
    name: 'Mounting.jpg',
    contentType: 'image/jpeg',
  };
  const PLACE: FilePlace = { slot: 'step', slotKey: 'mounting' };
  const TICK = `POST /projects/${PROJECT_ID}/steps/tick`;

  /** The project once the step's photo is on it. */
  function photographed(): ProjectDetail {
    const project = aProject();
    const photo = {
      id: FILE_ID,
      fileId: FILE_ID,
      name: PHOTO.name,
      contentType: PHOTO.contentType,
      addedAt: AT,
      addedBy: READER,
      shownToCustomer: false,
    };
    project.steps = project.steps.map((step) => ({ ...step, files: [photo] }));
    return project;
  }

  async function mountedOnTheJob() {
    origin.roles = [JOB_HOME_ROLE];
    origin.jobs = [{ ...aJob(1), id: PROJECT_ID }];
    const view = await mountedJobs();
    await waitFor(() => expect(view.result.current.project.read.kind).toBe('ready'));
    return view;
  }

  it('ticks the step once its photo is on the project, with who did the work', async () => {
    const view = await mountedOnTheJob();
    act(() => view.result.current.tickOncePhotographed('mounting', 'Suresh'));
    await settle();
    expect(writesSent()).toEqual([]);
    answerNext('files', { status: 200, body: photographed() });
    act(() => view.result.current.project.upload(PHOTO, PLACE));
    await waitFor(() => expect(writesSent()).toContain(TICK));
    expect(writesSent().slice(-2)).toEqual([`POST /projects/${PROJECT_ID}/files`, TICK]);
    expect(origin.writes.at(-1)?.body).toEqual({
      step: 'mounting',
      doneBy: 'Suresh',
      capturedAt: expect.any(String),
    });
  });

  it('a photo that did not go up keeps its tick waiting for the Retry', async () => {
    const view = await mountedOnTheJob();
    act(() => view.result.current.tickOncePhotographed('mounting', null));
    answerNext('complete', { status: 503, body: refusal('OBJECT_STORE_UNAVAILABLE') });
    act(() => view.result.current.project.upload(PHOTO, PLACE));
    await waitFor(() => expect(view.result.current.project.uploadFailed).toEqual(PLACE));
    await settle();
    expect(writesSent()).not.toContain(TICK);
    answerNext('files', { status: 200, body: photographed() });
    act(() => view.result.current.project.retryUpload());
    await waitFor(() => expect(writesSent()).toContain(TICK));
    expect(writesSent().filter((write) => write === TICK)).toHaveLength(1);
  });
});
