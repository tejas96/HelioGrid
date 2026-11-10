'use client';
import type { LeadImport } from '@heliogrid/contracts';
import {
  can,
  IMPORT_DUPLICATE_CHOICES,
  type ImportColumnViews,
  type ImportContinueGate,
  type ImportDuplicateChoice,
  type ImportPlacedHeader,
  type ImportWizardFrame,
  importColumnViews,
  LEAD_IMPORT_COLUMNS,
  LEAD_IMPORT_FIELDS,
  LEAD_IMPORT_ROW_SCOPES,
  type LeadImportField,
  type LeadImportFigures,
  type LeadImportOutcome,
  type LeadImportProgress,
  type LeadImportRowScope,
  type LeadImportRunGate,
  type LeadImportRunPlan,
  leadImportFiguresOf,
  leadImportGate,
  leadImportOutcomeOf,
  leadImportProgressOf,
  leadImportRunGate,
  leadImportRunPlanOf,
  placedHeadersOf,
  type Read,
} from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import type { ChosenSpreadsheet, ImportActFailure, ImportUpload } from './import-job-facts';
import { type ImportJob, useImportJob } from './use-import-job';
import { useFollowedImport } from './use-lead-import-follow';
import { type LeadImportRowList, useLeadImportRows } from './use-lead-import-rows';
import { useSession } from './use-session';

/**
 * The Lead Import Wizard (`SCR-M02-05`, `M02-18`…`M02-21`) as both screens draw it, assembled once
 * (Law 11): Upload → Map columns → Preview → Import, then the report. The shared import job reads
 * and maps the file; the preview counts the rows and the duplicates by phone before anything runs;
 * one choice settles every duplicate; the run goes on on the server, and leaving and coming back —
 * or opening the import's notice — finds its progress or its report.
 */
export interface LeadImportScreen {
  /** The reader may import leads (`crm.import_leads`): anyone else is told why not. */
  readonly allowed: boolean;
  readonly frame: ImportWizardFrame;
  /** The zero-based step: Upload, Map columns, Preview, Import. */
  readonly step: number;
  /** The job on screen, the moment it is opened — before its first read answers. */
  readonly jobId: string | null;
  readonly job: LeadImport | null;
  /** The job is being read again — a followed import or an address reopening — and not in yet. */
  readonly opening: boolean;
  /** The job could not be read: the screen says so, with Try again. */
  readonly jobFailed: { readonly retry: () => void } | null;
  readonly upload: ImportUpload;
  /** A failed upload holds a file to send again. */
  readonly canRetry: boolean;
  /** The sheet and header row the person reads, before and after they confirm. */
  readonly sheetPick: { readonly sheet: number; readonly headerRow: number } | null;
  /** Each column with its header, two first values and the field it fills now (`M02-18`). */
  readonly columns: ImportColumnViews<LeadImportField>;
  /** The columns the import reads, in the file's order: the report names cells under them. */
  readonly headers: readonly ImportPlacedHeader<LeadImportField>[];
  readonly gate: ImportContinueGate | null;
  /** What last did not go through: mapping or running. */
  readonly failure: ImportActFailure | null;
  /** "400 rows · 90 duplicates by phone", once the preview pass has judged them (`M02-19`). */
  readonly figures: LeadImportFigures | null;
  /** The one choice every duplicate follows (`M02-20`); skip unless changed. */
  readonly choice: ImportDuplicateChoice;
  readonly plan: LeadImportRunPlan | null;
  readonly runGate: LeadImportRunGate | null;
  /** The run is out: its act is inert, a second press sends nothing. */
  readonly runOut: boolean;
  readonly progress: LeadImportProgress | null;
  /** The report's figures, once the run completes (`M02-21`). */
  readonly outcome: LeadImportOutcome | null;
  /** The preview's part the rows are narrowed to, or every row. */
  readonly scope: LeadImportRowScope | null;
  /** The preview's rows, or the report's rejected rows. */
  readonly rows: LeadImportRowList;
  choose(file: ChosenSpreadsheet): void;
  couldNotRead(name: string): void;
  /** A failed upload sent again. */
  retry(): void;
  /*
   * Each act is named as `LeadImport`'s prop it answers, so a screen hands the screen's view to the
   * wizard whole and adds only what its platform owns.
   */
  onSheet(sheet: number): void;
  onHeaderRow(headerRow: number): void;
  onPlace(column: number, field: LeadImportField | null): void;
  /** Step 1 goes on; step 2 confirms the mapping and the preview pass starts. */
  onContinue(): void;
  onBack(): void;
  /** The duplicate choice, until the run is out; a word this build does not know changes nothing. */
  onChoice(choice: string): void;
  /** Narrows the rows to a part, or back to every row when it is the one in force. */
  onScope(scope: string): void;
  onRun(): void;
  /** Another file: this import stays as it is, and the device stops following it. */
  onStartOver(): void;
}

/**
 * Fills `LeadImportScreen`. `addressed` is a job an address names (`?job=` — the import's notice,
 * a reload); without one, the import this device last followed opens where it stands.
 */
export function useLeadImportScreen(addressed: string | null = null): LeadImportScreen {
  const { user } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const followed = useFollowedImport();
  const [choice, setChoice] = useState<ImportDuplicateChoice>('skip');
  const [scope, setScope] = useState<LeadImportRowScope | null>(null);
  const wizard: ImportJob<LeadImport, LeadImportField> = useImportJob(
    {
      subjectKind: 'lead_import',
      fields: LEAD_IMPORT_FIELDS,
      columns: LEAD_IMPORT_COLUMNS,
      jobKey: queryKeys.crm.leadImport,
      read: (id, signal) => repositories.leadImport.job(id, signal),
      start: (file) => repositories.leadImport.start(file),
      map: (id, mapping) => repositories.leadImport.map(id, mapping),
      run: (id) => repositories.leadImport.run(id, { duplicateChoice: choice }),
    },
    addressed ?? followed.resumable,
  );
  const { job, jobId, frame, tenantId } = wizard;

  // An address that changes while here — a notice opened over the wizard — opens its job.
  const reopen = wizard.reopen;
  const addressedBefore = useRef(addressed);
  useEffect(() => {
    if (addressed === addressedBefore.current) return;
    addressedBefore.current = addressed;
    // The address catching up with the job already open (a start writes it) opens nothing.
    if (addressed !== null && addressed !== jobId) reopen(addressed);
  }, [addressed, jobId, reopen]);
  // The followed import appears once the session is read: open it, unless a file is already out.
  const idle = jobId === null && wizard.upload.state === 'idle';
  const { resumable, resumableNow } = followed;
  useEffect(() => {
    const now = resumableNow();
    if (idle && resumable !== null && now !== null) reopen(now);
  }, [idle, resumable, resumableNow, reopen]);
  const { follow } = followed;
  useEffect(() => {
    follow(jobId, frame === 'report');
  }, [follow, jobId, frame]);
  // The run landed leads: every list, the inbox and each person's load read again.
  const completed = wizard.status === 'completed';
  useEffect(() => {
    if (completed) void queryClient.invalidateQueries({ queryKey: queryKeys.crm.all(tenantId) });
  }, [completed, queryClient, tenantId]);

  const phase = frame === 'preview' ? 'preview' : frame === 'report' ? 'report' : null;
  // Once run, the job's own choice is the truth; before, the person's.
  const chosen = IMPORT_DUPLICATE_CHOICES.find((known) => known === job?.run?.duplicateChoice);
  const inForce = chosen ?? choice;
  const columns = importColumnViews(
    job?.sheets ?? null,
    wizard.draft,
    LEAD_IMPORT_COLUMNS.mappingForHeader,
  );
  return {
    allowed: can(user?.tenant?.roles ?? [], 'crm.import_leads'),
    frame,
    step: wizard.step,
    jobId,
    job,
    ...jobReadOf(wizard.jobRead),
    upload: wizard.upload,
    canRetry: wizard.canRetry,
    sheetPick: wizard.draft,
    columns,
    headers: placedHeadersOf(columns),
    gate: leadImportGate(frame, wizard.draft?.columns ?? []),
    failure: wizard.failure,
    ...figuresOf(job, inForce),
    choice: inForce,
    runOut: wizard.runOut,
    scope: phase === 'preview' ? scope : null,
    rows: useLeadImportRows(jobId, phase, scope, inForce),
    choose: wizard.choose,
    couldNotRead: wizard.couldNotRead,
    retry: wizard.retry,
    onSheet: wizard.chooseSheet,
    onHeaderRow: wizard.chooseHeaderRow,
    onPlace: wizard.placeColumn,
    onContinue: () => void wizard.proceed(),
    onBack: wizard.back,
    onChoice(next) {
      const known = IMPORT_DUPLICATE_CHOICES.find((value) => value === next);
      if (known !== undefined && chosen === undefined) setChoice(known);
    },
    onScope(next) {
      const known = LEAD_IMPORT_ROW_SCOPES.find((value) => value === next) ?? null;
      setScope((now) => (now === known ? null : known));
    },
    onRun: () => void wizard.run(),
    onStartOver() {
      followed.forget();
      setChoice('skip');
      setScope(null);
      wizard.replace();
    },
  };
}

/** The job's figures as the screen states them: the counts, the run's plan, its place, its report. */
function figuresOf(job: LeadImport | null, choice: ImportDuplicateChoice) {
  const figures = leadImportFiguresOf(job?.counts ?? null);
  const plan = figures === null ? null : leadImportRunPlanOf(figures, choice);
  return {
    figures,
    plan,
    runGate: plan === null ? null : leadImportRunGate(plan),
    progress: job === null || job.run === null ? null : leadImportProgressOf(job.run),
    outcome: job === null || job.results === null ? null : leadImportOutcomeOf(job.results),
  };
}

/** The job's read as the wizard draws it: still out while reopened, or failed with its retry. */
function jobReadOf(read: Read<LeadImport> | null) {
  return {
    opening: read !== null && read.kind === 'loading',
    jobFailed: read !== null && read.kind === 'failed' ? { retry: read.retry } : null,
  };
}
