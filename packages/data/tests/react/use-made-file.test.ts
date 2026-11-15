// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProposalVersions } from '../../src/react/use-proposal-versions';
import { PROPOSAL } from './proposals-fixtures';
import { provided, sell } from './proposals-origin';

/**
 * A version's PDF opens because a tap asked for it, once per tap (`M06-51`), through the real client:
 * the read is asked again when the screen comes back to the front and answers a newly signed
 * address, and that new address alone opens nothing — the builder's Ready opened the PDF over and
 * over each time the person came back from it.
 */

const IN_AN_HOUR = new Date(Date.now() + 3_600_000).toISOString();

function mounted() {
  return renderHook(() => useProposalVersions(PROPOSAL, 1).pdf, { wrapper: provided() });
}

describe('useMadeFile — the file opens for a tap, never for a fresh address', () => {
  it('a newly signed address read without a tap opens nothing', async () => {
    sell.pdf = { url: 'https://files.test/v1.pdf?sig=a', expiresAt: IN_AN_HOUR };
    const opened: string[] = [];
    const view = mounted();
    act(() => view.result.current.get((url) => opened.push(url)));
    await waitFor(() => expect(opened).toEqual(['https://files.test/v1.pdf?sig=a']));

    sell.pdf = { url: 'https://files.test/v1.pdf?sig=b', expiresAt: IN_AN_HOUR };
    act(() => view.result.current.lookAgain());
    await waitFor(() =>
      expect(view.result.current.file).toMatchObject({
        kind: 'made',
        download: { url: 'https://files.test/v1.pdf?sig=b' },
      }),
    );

    expect(opened).toEqual(['https://files.test/v1.pdf?sig=a']);
  });

  it('a second tap on a made file opens its address at once', async () => {
    sell.pdf = { url: 'https://files.test/v1.pdf?sig=a', expiresAt: IN_AN_HOUR };
    const opened: string[] = [];
    const view = mounted();
    act(() => view.result.current.get((url) => opened.push(url)));
    await waitFor(() => expect(opened).toHaveLength(1));

    act(() => view.result.current.get((url) => opened.push(url)));

    expect(opened).toEqual(['https://files.test/v1.pdf?sig=a', 'https://files.test/v1.pdf?sig=a']);
  });
});
