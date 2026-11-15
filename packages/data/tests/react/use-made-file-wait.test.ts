// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MADE_FILE_LOOK_MS, MADE_FILE_LOOKS } from '../../src/react/use-made-file';
import { useProposalVersions } from '../../src/react/use-proposal-versions';
import { PROPOSAL } from './proposals-fixtures';
import { provided, sell } from './proposals-origin';
import { originActs } from './proposals-origin-acts';

/**
 * A PDF the server is still making (`M06-51`, `F5-39`), through the real client: it is asked for
 * again every few seconds until it is there, and then no more; past the wait the screen says it is
 * late, and *Look again* waits as long again. The wait is measured on the answers' clock, so the
 * clock alone is moved past it — the looks themselves still go out on their own interval.
 */

const IN_AN_HOUR = () => new Date(Date.now() + 3_600_000).toISOString();
const WAIT_MS = MADE_FILE_LOOK_MS * MADE_FILE_LOOKS;

function mounted() {
  return renderHook(() => useProposalVersions(PROPOSAL, 1).pdf, { wrapper: provided() });
}

/** Lets an answer already out reach the hook. */
const answered = () => new Promise((resolve) => setTimeout(resolve, 200));

/** Lets the hook's next look go out and answer. */
const nextLook = () => new Promise((resolve) => setTimeout(resolve, MADE_FILE_LOOK_MS + 400));

afterEach(() => {
  vi.useRealTimers();
});

describe('useMadeFile — a file still being made is looked for, then said to be late', () => {
  it('looks again while it is being made, and stops once it is made', async () => {
    const view = mounted();
    act(() => view.result.current.ask());
    await waitFor(() => expect(originActs.pdfReads).toBe(1));
    expect(view.result.current.file.kind).toBe('making');

    sell.pdf = { url: 'https://files.test/v1.pdf?sig=a', expiresAt: IN_AN_HOUR() };
    await waitFor(() => expect(view.result.current.file.kind).toBe('made'), { timeout: 5000 });
    const reads = originActs.pdfReads;
    expect(reads).toBe(2);

    await nextLook();
    expect(originActs.pdfReads).toBe(reads);
  }, 15_000);

  it('past the wait it is late and asks no more; Look again waits as long again', async () => {
    vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true });
    const view = mounted();
    act(() => view.result.current.ask());
    await waitFor(() => expect(originActs.pdfReads).toBe(1));
    await answered();
    expect(view.result.current.file.kind).toBe('making');

    vi.setSystemTime(Date.now() + WAIT_MS + 1000);
    await waitFor(() => expect(view.result.current.file.kind).toBe('late'), { timeout: 5000 });
    const reads = originActs.pdfReads;
    await nextLook();
    expect(originActs.pdfReads).toBe(reads);

    act(() => view.result.current.lookAgain());
    await waitFor(() => expect(originActs.pdfReads).toBe(reads + 1));
    expect(view.result.current.file.kind).toBe('making');
    sell.pdf = { url: 'https://files.test/v1.pdf?sig=b', expiresAt: IN_AN_HOUR() };
    await waitFor(() => expect(view.result.current.file.kind).toBe('made'), { timeout: 5000 });
  }, 20_000);
});
