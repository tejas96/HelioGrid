// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useProposalReaderScreen } from '../../src/react/use-proposal-reader-screen';
import { PROPOSAL } from './proposals-fixtures';
import { provided, sell } from './proposals-origin';

/**
 * The document reader through the real client (`SCR-M06-17`, `T-M06-015`, `M06-51`): the PDF opens
 * once it is made, and a download address past its life is never opened — the file is asked for
 * again and the fresh address opens.
 */

const START = Date.parse('2026-11-14T10:00:00.000Z');
const MINUTE = 60_000;
const pdfAt = (url: string, from: number) => ({
  url,
  expiresAt: new Date(from + 5 * MINUTE).toISOString(),
});

afterEach(() => vi.useRealTimers());

async function mounted(version: number | null = 1) {
  const opened: string[] = [];
  const moves = {
    toBuilder: vi.fn(),
    toShare: vi.fn(),
    openFile: (url: string) => opened.push(url),
  };
  const view = renderHook(() => useProposalReaderScreen(PROPOSAL, version, moves), {
    wrapper: provided(),
  });
  await waitFor(() => expect(view.result.current.proposal.kind).toBe('ready'));
  return { view, opened };
}

describe('the reader’s PDF', () => {
  it('a PDF still being made opens once it is there, from one tap', async () => {
    const { view, opened } = await mounted();

    act(() => view.result.current.getPdf());
    await waitFor(() => expect(view.result.current.pending).toBe('pdf'));
    sell.pdf = pdfAt('https://files.example/one.pdf', Date.now());
    act(() => view.result.current.pdf.lookAgain());
    await waitFor(() => expect(opened).toEqual(['https://files.example/one.pdf']));
  });

  it('an address past its life is not opened: the file is asked again and the fresh one opens', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(START);
    sell.pdf = pdfAt('https://files.example/first.pdf', START);
    const { view, opened } = await mounted();

    act(() => view.result.current.getPdf());
    await waitFor(() => expect(opened).toEqual(['https://files.example/first.pdf']));

    vi.setSystemTime(START + 6 * MINUTE);
    sell.pdf = pdfAt('https://files.example/fresh.pdf', START + 6 * MINUTE);
    act(() => view.result.current.getPdf());
    await waitFor(() => expect(opened).toHaveLength(2));

    expect(opened[1]).toBe('https://files.example/fresh.pdf');
  });

  it('a draft never generated has no PDF to get: the tap does nothing', async () => {
    const { view, opened } = await mounted(null);

    act(() => view.result.current.getPdf());

    expect(view.result.current.version).toBeNull();
    expect(view.result.current.pdf.file).toEqual({ kind: 'idle' });
    expect(opened).toHaveLength(0);
  });
});
