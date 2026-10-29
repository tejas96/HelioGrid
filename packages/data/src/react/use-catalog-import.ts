'use client';
import type { CatalogImportWire } from '@heliogrid/contracts';
import {
  type CatalogImportCounts,
  type CatalogImportEntryPoint,
  type CatalogImportField,
  type CatalogImportMapping,
  FILE_SUBJECT_RULES,
  guessImportMapping,
  IMPORT_POLL_SECONDS,
  IMPORT_WIZARD_START,
  type ImportContinueGate,
  type ImportWizardEvent,
  type ImportWizardFrame,
  importContinueGate,
  importWizardFrame,
  importWizardStepIndex,
  importWizardViewAfter,
  judgeFileDeclaration,
  mappingForHeader,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { REFUSED_AS_ANOTHER_TYPE } from '../file/repository';
import { useAction } from './action';
import {
  type ChosenSpreadsheet,
  type ImportActFailure,
  type ImportUpload,
  IN_FLIGHT,
  mappingOf,
  SPREADSHEET_TYPES,
  type SpreadsheetType,
  stateOf,
} from './catalog-import-facts';
import { useRepositories } from './context';
import { readOf } from './read';
import { useTenantId } from './use-tenant-id';

/**
 * One import, from a chosen file to its report (`SCR-M01-17`, `M01-41`): the file judged on the
 * device and stored, the job started and read again every `IMPORT_POLL_SECONDS` while the server
 * reads, matches or runs it, the mapping the device proposes and the person changes, and each
 * step's act. A stored file is never stored twice: a start that failed is sent again from it.
 */
export function useCatalogImport(entryPoint: CatalogImportEntryPoint) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [view, setView] = useState(IMPORT_WIZARD_START);
  const [draft, setDraft] = useState<CatalogImportMapping | null>(null);
  const [upload, setUpload] = useState<ImportUpload>({ state: 'idle' });
  const [failure, setFailure] = useState<ImportActFailure | null>(null);
  const stored = useRef<{ readonly file: ChosenSpreadsheet; readonly fileId: string } | null>(null);
  // The file whose upload failed before it was stored: *Try again* sends it whole.
  const pending = useRef<ChosenSpreadsheet | null>(null);

  const jobKey = queryKeys.catalog.import(tenantId, jobId ?? '');
  const read = useQuery({
    queryKey: jobKey,
    queryFn: ({ signal }) => repositories.catalogImport.job(jobId ?? '', signal),
    enabled: jobId !== null && tenantId !== '',
    // Read again while the server works on the job — or while it has never answered, so a read
    // that failed is tried again and the screen leaves its wait on its own.
    refetchInterval: (query) => {
      // A refusal (a job that is not this company's, or gone) is final: nothing to read again.
      const refused = query.state.error instanceof ApiError && !query.state.error.retryable;
      if (refused) return false;
      return query.state.data === undefined || IN_FLIGHT.includes(stateOf(query.state.data))
        ? IMPORT_POLL_SECONDS * 1000
        : false;
    },
  });
  const jobRead = readOf(read);
  const job = read.data ?? null;
  const status = jobId === null ? null : job === null ? 'reading' : stateOf(job);
  const frame = importWizardFrame(status, view);

  // The device proposes a mapping once the read step has counted the sheets.
  const sheets = job?.sheets ?? null;
  useEffect(() => {
    if (draft === null && sheets !== null)
      setDraft(mappingOf(job?.mapping) ?? guessImportMapping(sheets));
  }, [draft, sheets, job?.mapping]);

  // A completed run wrote prices: the whole catalog reads again.
  const completed = status === 'completed';
  useEffect(() => {
    if (completed)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.catalog.all(tenantId),
        // The finished job itself is read as it stands; its row lists and the catalog read again.
        predicate: (query) => !(query.queryKey[2] === 'import' && query.queryKey.length === 4),
      });
  }, [completed, queryClient, tenantId]);

  const move = (event: ImportWizardEvent) =>
    setView((now) => importWizardViewAfter(now, frame, event));
  const settle = (next: CatalogImportWire) =>
    queryClient.setQueryData(queryKeys.catalog.import(tenantId, next.id), next);

  const start = async (file: ChosenSpreadsheet, contentType: SpreadsheetType) => {
    setUpload({ state: 'storing', name: file.name });
    pending.current = file;
    try {
      const fileId =
        stored.current?.file === file
          ? stored.current.fileId
          : (
              await repositories.file.store({
                subjectKind: 'catalog',
                subjectRef: tenantId,
                contentType,
                bytes: file.bytes,
              })
            ).id;
      stored.current = { file, fileId };
      const next = await repositories.catalogImport.start({
        fileId,
        entryPoint,
        fileName: file.name,
        savedAt: file.savedAt,
      });
      settle(next);
      void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.imports(tenantId) });
      setDraft(null);
      setView(IMPORT_WIZARD_START);
      setJobId(next.id);
      setUpload({ state: 'idle' });
      pending.current = null;
    } catch (error) {
      // The store read other bytes than the type the device named: the file is refused, not lost.
      if (error instanceof ApiError && REFUSED_AS_ANOTHER_TYPE.includes(error.code)) {
        pending.current = null;
        stored.current = null;
        setUpload({ state: 'refused', name: file.name, refusal: 'type-not-taken' });
        return;
      }
      setUpload({ state: 'failed', name: file.name });
    }
  };

  const remap = (mapping: CatalogImportMapping) => setDraft(mapping);

  /* One run for any number of presses: a press while one is out sends nothing. */
  const running = useAction(
    async (id: string) => {
      setFailure(null);
      return repositories.catalogImport.run(id);
    },
    {
      onDone: (next) => {
        settle(next);
        void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.imports(tenantId) });
        move({ type: 'ran' });
      },
      onFailed: (error) => {
        setFailure({ act: 'run', conflict: error instanceof ApiError && error.status === 409 });
        void read.refetch();
      },
    },
  );

  return {
    tenantId,
    jobId,
    job,
    /** The job's state as this build knows it; `null` before a file is chosen. */
    status,
    frame,
    step: importWizardStepIndex(frame),
    /**
     * The job's read; `null` before a file is chosen. Still out is a kept report reopening;
     * failed, the screen says so — and the read keeps trying on its own.
     */
    jobRead: jobId === null ? null : jobRead,
    /** A failed upload holds a file to send again; a file the device could not read does not. */
    canRetry: pending.current !== null,
    draft,
    gate: importContinueGate(frame, draft?.columns ?? []) satisfies ImportContinueGate | null,
    upload,
    failure,
    /** Judged on the device first: a file the store would refuse is never sent. */
    choose(file: ChosenSpreadsheet) {
      const contentType = SPREADSHEET_TYPES.find((taken) => taken === file.contentType);
      const verdict =
        contentType === undefined
          ? 'type-not-taken'
          : judgeFileDeclaration(FILE_SUBJECT_RULES.catalog, contentType, file.bytes.byteLength);
      if (contentType === undefined || verdict !== 'accepted') {
        return setUpload({
          state: 'refused',
          name: file.name,
          refusal: verdict === 'accepted' ? 'type-not-taken' : verdict,
        });
      }
      void start(file, contentType);
    },
    /** The device could not read the file it picked: said as a failed upload, with nothing to resend. */
    couldNotRead(name: string) {
      pending.current = null;
      setUpload({ state: 'failed', name });
    },
    /** A failed upload or start, sent again — from the file already stored, when it was. */
    retry() {
      const held = pending.current ?? stored.current?.file;
      const contentType = SPREADSHEET_TYPES.find((taken) => taken === held?.contentType);
      if (held !== null && held !== undefined && contentType !== undefined)
        void start(held, contentType);
    },
    chooseSheet(sheet: number) {
      if (sheets !== null) remap(mappingForHeader(sheets, sheet, 0));
    },
    chooseHeaderRow(headerRow: number) {
      if (sheets !== null && draft !== null)
        remap(mappingForHeader(sheets, draft.sheet, headerRow));
    },
    placeColumn(column: number, field: CatalogImportField | null) {
      if (draft === null) return;
      remap({
        ...draft,
        columns: draft.columns.map((placed, at) => (at === column ? field : placed)),
      });
    },
    /** Step 1 goes on locally; step 2 confirms the mapping, which starts the matching pass. */
    async proceed() {
      if (frame === 'file') return move({ type: 'continued' });
      if (frame !== 'columns' || jobId === null || draft === null) return;
      setFailure(null);
      try {
        settle(
          await repositories.catalogImport.map(jobId, { ...draft, columns: [...draft.columns] }),
        );
        move({ type: 'mapped' });
      } catch (error) {
        setFailure({ act: 'map', conflict: error instanceof ApiError && error.status === 409 });
        void read.refetch();
      }
    },
    back: () => move({ type: 'back' }),
    /** Starts the run; resolves `true` once it is started. */
    run: async () => jobId !== null && (await running.run(jobId)).kind === 'done',
    /** A fix's answer: the job's counts as they now stand. */
    takeCounts(counts: CatalogImportCounts) {
      if (job !== null) settle({ ...job, counts });
    },
    fixOpenRows: () => move({ type: 'fix_opened' }),
    /** A kept report, or a job left before its run, opened where it stands. */
    reopen(id: string) {
      setDraft(null);
      setView(IMPORT_WIZARD_START);
      setJobId(id);
    },
    /** A new file in place of this one: the job stays kept, and nothing reaches the catalog. */
    replace() {
      stored.current = null;
      setDraft(null);
      setJobId(null);
      setUpload({ state: 'idle' });
      move({ type: 'replaced' });
    },
  };
}

export type CatalogImport = ReturnType<typeof useCatalogImport>;
export type { ChosenSpreadsheet, ImportActFailure, ImportUpload, ImportWizardFrame };
