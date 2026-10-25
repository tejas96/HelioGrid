// @vitest-environment happy-dom
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCatalogImport } from '../../src/react/use-catalog-import';
import { useCatalogImportFixes } from '../../src/react/use-catalog-import-rows';
import { useSession } from '../../src/react/use-session';
import { JOB_ID, mountedOver, origin, refusal } from './catalog-import-origin';

/** The import wizard's job through the real client: each answer its acts and its reads meet. */
describe('the import wizard’s job, through the real client', () => {
  const opened = async () => {
    const view = mountedOver(() => {
      const wizard = useCatalogImport('settings');
      return {
        session: useSession(),
        wizard,
        fixes: useCatalogImportFixes(wizard.jobId, null, wizard.takeCounts),
      };
    });
    await waitFor(() => expect(view.result.current.session.user?.tenant?.id).toBeTruthy());
    act(() => view.result.current.wizard.reopen(JOB_ID));
    await waitFor(() => expect(view.result.current.wizard.job?.id).toBe(JOB_ID));
    return view;
  };

  it('starts one run for two presses', async () => {
    const view = await opened();
    await act(async () => {
      await Promise.all([view.result.current.wizard.run(), view.result.current.wizard.run()]);
    });
    expect(origin.sent).toEqual(['POST run']);
    expect(view.result.current.wizard.frame).toBe('running');
  });

  it('stops polling when the run ends or the screen leaves', async () => {
    origin.job = { ...origin.job, status: 'running' };
    const view = await opened();
    await waitFor(() => expect(origin.reads).toBeGreaterThanOrEqual(2), { timeout: 4000 });
    origin.job = { ...origin.job, status: 'completed' };
    await waitFor(() => expect(view.result.current.wizard.frame).toBe('report'), { timeout: 4000 });
    const ended = origin.reads;
    await new Promise((resolve) => setTimeout(resolve, 2500));
    expect(origin.reads).toBe(ended);

    origin.job = { ...origin.job, status: 'running' };
    const again = await opened();
    const left = origin.reads;
    again.unmount();
    await new Promise((resolve) => setTimeout(resolve, 2500));
    expect(origin.reads).toBe(left);
  }, 15000);

  it('reads the job again after a fix answered 409', async () => {
    const view = await opened();
    const reads = origin.reads;
    origin.writes = [{ status: 409, body: refusal('CONFLICT') }];
    let answer = '';
    await act(async () => {
      const row = { rowNumber: 3 } as Parameters<typeof view.result.current.fixes.fix>[0];
      answer = await view.result.current.fixes.fix(row, 3, { leaveOut: true }, { leaveOut: false });
    });
    expect(answer).toBe('conflict');
    await waitFor(() => expect(origin.reads).toBeGreaterThan(reads));
    expect(view.result.current.fixes.fixed.size).toBe(0);
  });

  it('holds a fixed row with its undo, and takes it back', async () => {
    const view = await opened();
    const row = { rowNumber: 4 } as Parameters<typeof view.result.current.fixes.fix>[0];
    await act(async () => {
      await view.result.current.fixes.fix(
        row,
        4,
        { cells: { rate: '104' } },
        { cells: { rate: '' } },
      );
    });
    expect(view.result.current.fixes.fixed.get(4)?.undo).toEqual({
      rowNumber: 4,
      body: { cells: { rate: '' } },
    });
    await act(async () => {
      await view.result.current.fixes.undo(4);
    });
    expect(origin.sent).toEqual(['PUT fix', 'PUT fix']);
    expect(view.result.current.fixes.fixed.size).toBe(0);
  });
});
