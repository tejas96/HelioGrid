'use client';
import {
  FILE_SUBJECT_RULES,
  IMPORT_POLL_SECONDS,
  IMPORT_WIZARD_START,
  type ImportColumnGuesser,
  type ImportMapping,
  type ImportSheet,
  type ImportWizardEvent,
  importWizardFrame,
  importWizardStepIndex,
  importWizardViewAfter,
  judgeFileDeclaration,
} from '@heliogrid/domain';
import { type QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../errors/errors';
import { REFUSED_AS_ANOTHER_TYPE } from '../file/repository';
import { useAction } from './action';
import { useRepositories } from './context';
import {
  type ChosenSpreadsheet,
  type ImportActFailure,
  type ImportUpload,
  IN_FLIGHT,
  type MappingWire,
  mappingOf,
  SPREADSHEET_TYPES,
  type SpreadsheetType,
  stateOf,
} from './import-job-facts';
import { readOf } from './read';
import { useTenantId } from './use-tenant-id';

/** What every import job carries that the wizard reads: where it is, its sheets, its mapping. */
export interface ImportJobWire {
  readonly id: string;
  readonly status: string;
  readonly sheets: readonly ImportSheet[] | null;
  readonly mapping: MappingWire | null;
}

/** One import's own parts: its file kind, its fields and guess, its cache key and its routes. */
export interface ImportJobSource<Job extends ImportJobWire, Field extends string> {
  /** The kind its spreadsheet is stored as, under the company's own id; its rule judges a file. */
  readonly subjectKind: 'catalog' | 'lead_import';
  readonly fields: readonly Field[];
  readonly columns: ImportColumnGuesser<Field>;
  readonly jobKey: (tenantId: string, id: string) => QueryKey;
  readonly read: (id: string, signal?: AbortSignal) => Promise<Job>;
  readonly start: (file: {
    readonly fileId: string;
    readonly fileName: string;
    readonly savedAt: string | null;
  }) => Promise<Job>;
  readonly map: (
    id: string,
    mapping: { readonly sheet: number; readonly headerRow: number; columns: (Field | null)[] },
  ) => Promise<Job>;
  readonly run: (id: string) => Promise<Job>;
}

/**
 * One import, from a chosen file to its report (`SCR-M01-17`, `SCR-M02-05`): the file judged on
 * the device and stored, the job started and read again every `IMPORT_POLL_SECONDS` while the
 * server reads, matches or runs it, the mapping the device proposes and the person changes, and
 * each step's act. A stored file is never stored twice: a start that failed is sent again from it.
 */
export function useImportJob<Job extends ImportJobWire, Field extends string>(
  source: ImportJobSource<Job, Field>,
  /** A job to open where it stands — an address naming it, or one left and returned to. */
  opened: string | null = null,
) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(opened);
  const [view, setView] = useState(IMPORT_WIZARD_START);
  const [draft, setDraft] = useState<ImportMapping<Field> | null>(null);
  const [upload, setUpload] = useState<ImportUpload>({ state: 'idle' });
  const [failure, setFailure] = useState<ImportActFailure | null>(null);
  const stored = useRef<{ readonly file: ChosenSpreadsheet; readonly fileId: string } | null>(null);
  // The file whose upload failed before it was stored: *Try again* sends it whole.
  const pending = useRef<ChosenSpreadsheet | null>(null);

  const read = useQuery({
    queryKey: source.jobKey(tenantId, jobId ?? ''),
    queryFn: ({ signal }) => source.read(jobId ?? '', signal),
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
  const job = read.data ?? null;
  const status = jobId === null ? null : job === null ? 'reading' : stateOf(job);
  const frame = importWizardFrame(status, view);

  // The device proposes a mapping once the read step has counted the sheets.
  const sheets = job?.sheets ?? null;
  useEffect(() => {
    if (draft === null && sheets !== null)
      setDraft(mappingOf(job?.mapping, source.fields) ?? source.columns.guessMapping(sheets));
  }, [draft, sheets, job?.mapping, source]);

  const move = (event: ImportWizardEvent) =>
    setView((now) => importWizardViewAfter(now, frame, event));
  const settle = (next: Job) => queryClient.setQueryData(source.jobKey(tenantId, next.id), next);
  const rule = FILE_SUBJECT_RULES[source.subjectKind];

  const start = async (file: ChosenSpreadsheet, contentType: SpreadsheetType) => {
    setUpload({ state: 'storing', name: file.name });
    pending.current = file;
    try {
      const fileId =
        stored.current?.file === file
          ? stored.current.fileId
          : (
              await repositories.file.store({
                subjectKind: source.subjectKind,
                subjectRef: tenantId,
                contentType,
                bytes: file.bytes,
              })
            ).id;
      stored.current = { file, fileId };
      const next = await source.start({ fileId, fileName: file.name, savedAt: file.savedAt });
      settle(next);
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

  /* One run for any number of presses: a press while one is out sends nothing. */
  const running = useAction(
    async (id: string) => {
      setFailure(null);
      return source.run(id);
    },
    {
      onDone: (next) => {
        settle(next);
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
     * The job's read; `null` before a file is chosen. Still out is a job reopening; failed, the
     * screen says so — and the read keeps trying on its own.
     */
    jobRead: jobId === null ? null : readOf(read),
    /** A failed upload holds a file to send again; a file the device could not read does not. */
    canRetry: pending.current !== null,
    draft,
    upload,
    failure,
    /** The run is out: its act is inert and a second press sends nothing. */
    runOut: running.pending,
    /** A job the person answered with: kept as the job's last read. */
    settle,
    /** Judged on the device first: a file the store would refuse is never sent. */
    choose(file: ChosenSpreadsheet) {
      const contentType = SPREADSHEET_TYPES.find((taken) => taken === file.contentType);
      const verdict =
        contentType === undefined
          ? 'type-not-taken'
          : judgeFileDeclaration(rule, contentType, file.bytes.byteLength);
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
      if (sheets !== null) setDraft(source.columns.mappingForHeader(sheets, sheet, 0));
    },
    chooseHeaderRow(headerRow: number) {
      if (sheets !== null && draft !== null)
        setDraft(source.columns.mappingForHeader(sheets, draft.sheet, headerRow));
    },
    placeColumn(column: number, field: Field | null) {
      if (draft === null) return;
      setDraft({
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
        settle(await source.map(jobId, { ...draft, columns: [...draft.columns] }));
        move({ type: 'mapped' });
      } catch (error) {
        setFailure({ act: 'map', conflict: error instanceof ApiError && error.status === 409 });
        void read.refetch();
      }
    },
    back: () => move({ type: 'back' }),
    /** Starts the run; resolves `true` once it is started. */
    run: async () => jobId !== null && (await running.run(jobId)).kind === 'done',
    fixOpenRows: () => move({ type: 'fix_opened' }),
    /** A kept job opened where it stands. */
    reopen(id: string) {
      setDraft(null);
      setView(IMPORT_WIZARD_START);
      setJobId(id);
    },
    /** A new file in place of this one: the job stays kept, and nothing is imported. */
    replace() {
      stored.current = null;
      setDraft(null);
      setJobId(null);
      setUpload({ state: 'idle' });
      move({ type: 'replaced' });
    },
  };
}

export type ImportJob<Job extends ImportJobWire, Field extends string> = ReturnType<
  typeof useImportJob<Job, Field>
>;
