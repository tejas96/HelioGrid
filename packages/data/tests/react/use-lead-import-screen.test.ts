// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  COMPLETED,
  DUPLICATE_ROW,
  EXECUTIVE_ROLE,
  JOB_ID,
  MANAGER_ROLE,
  mountedWizard,
  OWNER_ROLE,
  origin,
  REJECTED_ROW,
  RUNNING,
} from './lead-import-origin';

/** The poll's interval, and room for one more read after it. */
const POLLED_MS = 6000;

describe('the lead import wizard, through the real client (SCR-M02-05)', () => {
  const opened = async (address: string | null = JOB_ID) => {
    const wizard = mountedWizard(address);
    await waitFor(() => expect(wizard.screen().job?.id).toBe(JOB_ID));
    return wizard;
  };

  it('states 400 rows and 90 duplicates by phone before anything runs, and 310 to create', async () => {
    origin.rows = [DUPLICATE_ROW];
    const wizard = await opened();
    expect(wizard.screen().frame).toBe('preview');
    expect(wizard.screen().figures).toEqual({
      rows: 400,
      duplicates: 90,
      rejected: 0,
      create: 310,
    });
    expect(wizard.screen().plan).toEqual({ create: 310, log: 0 });
    await waitFor(() => expect(wizard.screen().rows.read.kind).toBe('ready'));
    const read = wizard.screen().rows.read;
    const [row] = read.kind === 'ready' ? read.value : [];
    expect(row).toMatchObject({
      rowNumber: 3,
      fate: 'will_skip',
      match: DUPLICATE_ROW.duplicateOf,
    });
    expect(origin.writes).toEqual([]);
  });

  it('skip is the default, log as enquiry is the other choice, and one run sends the one choice', async () => {
    origin.rows = [DUPLICATE_ROW];
    const wizard = await opened();
    expect(wizard.screen().choice).toBe('skip');
    act(() => wizard.screen().onChoice('keep_both'));
    expect(wizard.screen().choice).toBe('skip');
    act(() => wizard.screen().onChoice('log_enquiry'));
    expect(wizard.screen().plan).toEqual({ create: 310, log: 90 });
    await waitFor(() => {
      const read = wizard.screen().rows.read;
      expect(read.kind === 'ready' ? read.value[0]?.fate : null).toBe('will_log');
    });
    await act(async () => {
      wizard.screen().onRun();
      wizard.screen().onRun();
    });
    await waitFor(() => expect(wizard.screen().frame).toBe('running'));
    expect(origin.writes).toEqual([
      { path: `/lead-imports/${JOB_ID}/run`, body: { duplicateChoice: 'log_enquiry' } },
    ]);
  });

  it('narrows the preview to one part, and back to every row', async () => {
    const wizard = await opened();
    act(() => wizard.screen().onScope('duplicate'));
    await waitFor(() => expect(origin.rowAsks.at(-1)).toContain('verdict=duplicate'));
    act(() => wizard.screen().onScope('duplicate'));
    expect(wizard.screen().scope).toBeNull();
  });

  it('leaving a running import and coming back shows its progress, then its report', async () => {
    origin.job = structuredClone(RUNNING);
    origin.rows = [REJECTED_ROW];
    const wizard = await opened();
    expect(wizard.screen().progress).toEqual({ done: 120, total: 400, share: 0.3 });
    wizard.leave();
    wizard.back();
    await waitFor(() => expect(wizard.screen().job?.id).toBe(JOB_ID));
    expect(wizard.screen().frame).toBe('running');
    origin.job = structuredClone(COMPLETED);
    await waitFor(() => expect(wizard.screen().frame).toBe('report'), { timeout: POLLED_MS });
    expect(wizard.screen().outcome).toMatchObject({
      landed: 308,
      skipped: 90,
      rejected: 2,
      read: 400,
    });
    await waitFor(() => expect(wizard.screen().rows.read.kind).toBe('ready'));
    expect(origin.rowAsks.at(-1)).toContain('result=rejected');
    const read = wizard.screen().rows.read;
    expect(read.kind === 'ready' ? read.value[0] : null).toMatchObject({
      rowNumber: 18,
      fate: 'rejected',
      problems: ['unreadable_number'],
    });
  }, 15000);

  it('once its report has been shown, coming back starts a new import', async () => {
    origin.job = structuredClone(COMPLETED);
    const wizard = await opened();
    await waitFor(() => expect(wizard.screen().frame).toBe('report'));
    wizard.leave();
    wizard.back();
    await waitFor(() => expect(wizard.screen().frame).toBe('empty'));
    expect(wizard.screen().job).toBeNull();
  });

  it('import another file lets the followed import go', async () => {
    origin.job = structuredClone(RUNNING);
    const wizard = await opened();
    act(() => wizard.screen().onStartOver());
    expect(wizard.screen().frame).toBe('empty');
    wizard.leave();
    wizard.back();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(wizard.screen().frame).toBe('empty');
  });

  it('the columns step guesses each column, and confirming it imports nothing', async () => {
    origin.job = {
      ...structuredClone(COMPLETED),
      status: 'mapped',
      counts: null,
      run: null,
      results: null,
    };
    const wizard = await opened();
    expect(wizard.screen().frame).toBe('file');
    await act(async () => wizard.screen().onContinue());
    expect(wizard.screen().frame).toBe('columns');
    expect(wizard.screen().columns.matched.map((column) => column.field)).toEqual([
      'name',
      'phone',
      'city',
    ]);
    expect(wizard.screen().columns.open[0]).toMatchObject({ header: 'Remarks', field: null });
    expect(wizard.screen().gate).toBeNull();
    act(() => wizard.screen().onPlace(1, null));
    expect(wizard.screen().gate).toBe('columns_unplaced');
    act(() => wizard.screen().onPlace(1, 'phone'));
    await act(async () => wizard.screen().onContinue());
    await waitFor(() => expect(wizard.screen().frame).toBe('matching'));
    expect(origin.writes.map((write) => write.path)).toEqual([`/lead-imports/${JOB_ID}/mapping`]);
  });

  it.each([
    ['the owner may import', OWNER_ROLE, true],
    ['a sales manager may import', MANAGER_ROLE, true],
    ['a sales executive may not', EXECUTIVE_ROLE, false],
  ] as const)('%s', async (_, role, allowed) => {
    origin.roles = [role];
    const wizard = mountedWizard(null);
    await waitFor(() => expect(wizard.screen().allowed).toBe(allowed));
  });
});
