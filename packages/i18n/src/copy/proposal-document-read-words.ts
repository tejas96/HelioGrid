import type { MinorUnits, ProposalVersionSnapshot } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { proposalPageWords } from './proposal-document-pages';

type T = Translator['t'];

/** The market's format as every reader screen holds it (`packages/ui`'s `useFormat()`). */
export interface ProposalDocumentReadFormat {
  number(value: number): string;
  amountPlain(value: MinorUnits): string;
  phone(e164: string): string;
}

/** What the words of one document need beside its snapshot. */
export interface ProposalDocumentReadInput {
  readonly snapshot: ProposalVersionSnapshot;
  /** The version's number; `null` on a draft or a sample. */
  readonly version: number | null;
  readonly format: ProposalDocumentReadFormat;
  /** The tax's name, from the market pack — `GST`. */
  readonly taxName: string;
}

/**
 * The document's words for every surface that draws it — the document screen, the track, the
 * customer's link, the printer's page and the defaults' sample — so none builds them its own way.
 * A certification scheme prints as its key: the key a market declares IS its statutory name
 * (`F1-20`, `F3-08`), so the market fact is the key itself.
 */
export function proposalDocumentReadWords(t: T, input: ProposalDocumentReadInput) {
  const { snapshot, version, format, taxName } = input;
  return proposalPageWords(t, {
    snapshot,
    ...(version === null ? {} : { version }),
    format: { number: format.number, amount: format.amountPlain, phone: format.phone },
    taxName,
    schemeName: (scheme: string) => scheme,
  });
}
