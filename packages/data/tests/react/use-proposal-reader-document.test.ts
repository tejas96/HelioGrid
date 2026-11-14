// @vitest-environment happy-dom
import { IN_FORMATS } from '@heliogrid/domain';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  type ProposalReaderWordsInput,
  useProposalReaderDocument,
} from '../../src/react/use-proposal-reader-document';
import { proposalDetail } from './proposals-fixtures';

/**
 * The one way a snapshot becomes pages (`F5-38`): every reader — the document, the track, the
 * customer's link, the printer's page and the defaults' sample — reads it here, so the words are
 * built over the same snapshot, version and tax name everywhere.
 */
const FORMAT = { pack: IN_FORMATS, date: (value: string) => `day ${value}` };
const said = (input: ProposalReaderWordsInput) => input;

describe('useProposalReaderDocument', () => {
  it('draws a version: its snapshot, its facts and words over its version and tax name', () => {
    const document = { ...proposalDetail({}).document, version: 3 };
    const { result } = renderHook(() =>
      useProposalReaderDocument({ document }, FORMAT, 'GST', said),
    );
    expect(result.current?.snapshot.money.figures.payable.value).toBeDefined();
    expect(result.current?.facts.dateText).toBe(`day ${document.date}`);
    expect(result.current?.words).toMatchObject({ version: 3, taxName: 'GST' });
  });

  it('draws nothing while the market’s tax name is out or there is no document', () => {
    const priced = proposalDetail({}).document;
    const out = renderHook(() =>
      useProposalReaderDocument({ document: priced }, FORMAT, null, said),
    );
    expect(out.result.current).toBeNull();
    const none = renderHook(() =>
      useProposalReaderDocument({ document: null }, FORMAT, 'GST', said),
    );
    expect(none.result.current).toBeNull();
  });

  it('draws a sample with the facts it is handed and no version', () => {
    const document = proposalDetail({}).document;
    const version = renderHook(() => useProposalReaderDocument({ document }, FORMAT, 'GST', said));
    const snapshot = version.result.current?.snapshot ?? null;
    const facts = { dateText: 'today', generationTier: 'estimated' } as const;
    const { result } = renderHook(() =>
      useProposalReaderDocument({ sample: snapshot, facts }, FORMAT, 'GST', said),
    );
    expect(result.current?.facts).toBe(facts);
    expect(result.current?.words).toMatchObject({ version: null, taxName: 'GST' });
  });
});
