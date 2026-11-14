import type { ProposalDetail } from '@heliogrid/contracts';
import { describe, expect, it } from 'vitest';
import { trackActWord, trackRowWords } from '../src/copy/proposal-after-track-rows';
import { createTranslator } from '../src/runtime';

/*
 * After Generate the proposal's document is the working draft again (its own version is null);
 * the versions made so far are the proposal's `versions`, so Track names the latest of those.
 */
function generated(versions: readonly number[]): ProposalDetail {
  return {
    document: { version: null, deal: { clientName: 'Anil Sharma' } },
    versions: versions.map((version) => ({ version })),
  } as unknown as ProposalDetail;
}

const formats = { when: (instant: string) => instant, ago: (instant: string) => instant };

describe('Track names the latest generated version, never the draft being worked', () => {
  it.each<[string, readonly number[], string, string]>([
    ['nothing generated', [], 'No version yet', 'Make version 1'],
    ['version 1 shared, draft open again', [1], 'Version 1 · current', 'Make version 2'],
    ['two versions', [1, 2], 'Version 2 · current', 'Make version 3'],
  ])('%s', async (_case, versions, row, act) => {
    const { t } = await createTranslator('en');
    const detail = generated(versions);
    expect(trackRowWords(t, formats, 'version', detail).title).toBe(row);
    expect(trackActWord(t, 'new_version', detail)).toBe(act);
  });
});

describe('Track’s document row counts the sheets the shown version prints, never its page kinds', () => {
  it.each<[string, number | null, string]>([
    ['eleven sheets from nine kinds of page', 11, '11 pages · English'],
    ['one sheet', 1, '1 page · English'],
  ])('%s', async (_case, sheets, title) => {
    const { t } = await createTranslator('en');
    const detail = {
      ...generated([1]),
      document: {
        version: null,
        deal: { clientName: 'Anil Sharma' },
        language: 'en',
        pages: Array.from({ length: 9 }, () => 'cover'),
      },
    } as unknown as ProposalDetail;
    expect(trackRowWords(t, formats, 'document', detail, sheets).title).toBe(title);
  });
});
