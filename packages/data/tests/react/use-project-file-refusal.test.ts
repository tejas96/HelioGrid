// @vitest-environment happy-dom

import { FILE_SUBJECT_RULES } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PickedFile } from '../../src/react/picked-file';
import { type FilePlace, useProjectScreen } from '../../src/react/use-project-screen';
import { PROJECT_ID } from './projects-fixtures';
import { mountedOver, writesSent } from './projects-origin';

/**
 * A pick a project cannot take — bigger than it takes, or not its type — is said in the page's
 * toast with why, before anything goes up and before a name is asked; never dropped, never a retry.
 */

async function mountedProject() {
  const view = mountedOver(() => useProjectScreen(PROJECT_ID));
  await waitFor(() => expect(view.result.current.read.kind).not.toBe('loading'));
  return view;
}

const PHOTO: PickedFile = {
  bytes: new Uint8Array([1, 2, 3, 4]),
  name: 'Feasibility letter',
  contentType: 'image/jpeg',
};

describe('Project — a pick it cannot take', () => {
  it('a file over the size a project takes is said in a toast, and nothing goes up', async () => {
    const place: FilePlace = { slot: 'document', slotKey: 'utility_feasibility' };
    const view = await mountedProject();
    const big = { ...PHOTO, bytes: new Uint8Array(FILE_SUBJECT_RULES.project.maxBytes + 1) };
    act(() => view.result.current.upload(big, place));
    expect(view.result.current.toast).toEqual({
      kind: 'fileRefused',
      why: 'too-large',
      name: 'Feasibility letter',
    });
    expect(view.result.current.uploading).toBeNull();
    expect(writesSent()).toEqual([]);
  });

  it('an oversized other file is refused before its name is asked, and no sheet opens', async () => {
    const view = await mountedProject();
    const big = { ...PHOTO, bytes: new Uint8Array(FILE_SUBJECT_RULES.project.maxBytes + 1) };
    act(() => view.result.current.upload(big, { slot: 'other', slotKey: null }));
    expect(view.result.current.naming).toBeNull();
    expect(view.result.current.sheet).toBeNull();
    expect(view.result.current.toast).toEqual({
      kind: 'fileRefused',
      why: 'too-large',
      name: 'Feasibility letter',
    });
  });

  it('a pick the chooser could not read as a project file is said, never dropped', async () => {
    const view = await mountedProject();
    act(() => view.result.current.refusePick('setup.exe', 'type-not-taken'));
    expect(view.result.current.toast).toEqual({
      kind: 'fileRefused',
      why: 'type-not-taken',
      name: 'setup.exe',
    });
    expect(writesSent()).toEqual([]);
  });
});
