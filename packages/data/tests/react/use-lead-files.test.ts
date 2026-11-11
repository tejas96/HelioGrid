// @vitest-environment happy-dom
import { useQuery } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { queryKeys } from '../../src/cache/keys';
import type { PickedFile } from '../../src/react/picked-file';
import { useLeadFiles } from '../../src/react/use-lead-files';
import { useTenantId } from '../../src/react/use-tenant-id';
import {
  ADDS_ROLE,
  aLeadFile,
  answerNext,
  FILE_ID,
  holdWrites,
  LEAD_ID,
  LINK,
  mountedOver,
  origin,
  READS_ONLY_ROLE,
  readsOf,
  settle,
} from './lead-files-origin';
import { refusal } from './origin-wire';

/**
 * A lead's files (`M02-32`) through the real client: read once the section is in view, a picked
 * file stored against the lead then put on it by name, one at a time, and the one that came back
 * undone kept to send again.
 */

const BILL: PickedFile = {
  bytes: new Uint8Array([1, 2, 3, 4]),
  name: 'Electricity bill.pdf',
  contentType: 'application/pdf',
};
const FILES_PATH = `/leads/${LEAD_ID}/files`;

async function mountedFiles() {
  const view = mountedOver(() => useLeadFiles(LEAD_ID, true));
  await waitFor(() => expect(view.result.current.read.kind).not.toBe('loading'));
  return view;
}

type FilesView = Awaited<ReturnType<typeof mountedFiles>>;
const namesOf = (view: FilesView) => {
  const { read } = view.result.current;
  return read.kind === 'ready' ? read.value.map((one) => one.name) : read.kind;
};

describe('Lead files — the read', () => {
  it('is not asked for until the section is in view', async () => {
    const view = mountedOver(({ shown }) => useLeadFiles(LEAD_ID, shown), { shown: false });
    await settle();
    expect(readsOf(FILES_PATH)).toBe(0);
    view.rerender({ shown: true });
    await waitFor(() => expect(view.result.current.read.kind).toBe('empty'));
    expect(readsOf(FILES_PATH)).toBe(1);
  });

  it('none yet reads empty; files read in the order the api lists them', async () => {
    expect((await mountedFiles()).result.current.read.kind).toBe('empty');
    origin.files = [aLeadFile(1, 'Bill.pdf'), aLeadFile(2, 'Roof.jpg')];
    expect(namesOf(await mountedFiles())).toEqual(['Bill.pdf', 'Roof.jpg']);
  });

  it.each([
    ['may add a file', ADDS_ROLE, true],
    ['reads only', READS_ONLY_ROLE, false],
  ])('a reader who %s is offered the add accordingly', async (_case, role, offered) => {
    origin.roles = [role];
    const view = await mountedFiles();
    await waitFor(() => expect(view.result.current.canAdd).toBe(offered));
  });

  it('a file opens through its short-lived link', async () => {
    const view = await mountedFiles();
    await expect(view.result.current.fileLink(FILE_ID)).resolves.toBe(LINK);
  });
});

describe('Lead files — adding one', () => {
  it('a pick is stored against the lead, put on it by its name, and listed from the answer', async () => {
    const view = await mountedFiles();
    const release = holdWrites();
    act(() => view.result.current.upload(BILL));
    expect(view.result.current.uploading).toBe(true);
    expect(view.result.current.picked).toBe('Electricity bill.pdf');
    release();
    await waitFor(() => expect(namesOf(view)).toEqual(['Electricity bill.pdf']));
    expect(view.result.current.uploading).toBe(false);
    expect(view.result.current.uploadFailed).toBe(false);
    expect(origin.writes.map(({ path, body }) => [path, body])).toEqual([
      ['/files', expect.objectContaining({ subjectKind: 'lead', subjectRef: LEAD_ID })],
      [`/files/${FILE_ID}/complete`, undefined],
      [
        FILES_PATH,
        { fileId: FILE_ID, name: 'Electricity bill.pdf', capturedAt: expect.any(String) },
      ],
    ]);
    expect(readsOf(FILES_PATH)).toBe(1);
  });

  it("a file put on the lead reads the lead again, so the Files tab's count moves with the list", async () => {
    let leadReads = 0;
    const view = mountedOver(() => {
      const tenantId = useTenantId();
      // The lead's own read, on its own key — what the Files tab counts from.
      useQuery({
        queryKey: queryKeys.crm.lead(tenantId, LEAD_ID),
        queryFn: () => {
          leadReads += 1;
          return leadReads;
        },
        enabled: tenantId !== '',
      });
      return useLeadFiles(LEAD_ID, true);
    });
    await waitFor(() => expect(leadReads).toBe(1));
    act(() => view.result.current.upload(BILL));
    await waitFor(() => expect(namesOf(view)).toEqual(['Electricity bill.pdf']));
    await waitFor(() => expect(leadReads).toBe(2));
  });

  it('a second pick while the first is out sends nothing', async () => {
    const view = await mountedFiles();
    const release = holdWrites();
    act(() => view.result.current.upload(BILL));
    act(() => view.result.current.upload({ ...BILL, name: 'Roof.jpg' }));
    release();
    await waitFor(() => expect(view.result.current.uploading).toBe(false));
    expect(origin.writes.filter(({ path }) => path === '/files')).toHaveLength(1);
    expect(namesOf(view)).toEqual(['Electricity bill.pdf']);
  });

  it.each([
    ['refused as not ready', 'attach', { status: 422, body: refusal('LEAD_FILE_NOT_READY') }],
    ['dropped on its way to the store', 'declare', 'drop' as const],
  ])(
    'a pick %s is kept as not added, and Retry sends the same file again',
    async (_case, key, answer) => {
      const view = await mountedFiles();
      answerNext(key, answer);
      act(() => view.result.current.upload(BILL));
      await waitFor(() => expect(view.result.current.uploadFailed).toBe(true));
      expect(view.result.current.picked).toBe('Electricity bill.pdf');
      expect(view.result.current.read.kind).toBe('empty');

      act(() => view.result.current.retryUpload());
      expect(view.result.current.uploadFailed).toBe(false);
      await waitFor(() => expect(namesOf(view)).toEqual(['Electricity bill.pdf']));
      const declared = origin.writes
        .filter(({ path }) => path === '/files')
        .map(({ body }) => body);
      expect(declared).toHaveLength(2);
      expect(declared[1]).toEqual(declared[0]);
    },
  );
});
