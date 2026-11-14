import {
  basisPoints,
  PROPOSAL_LIMITS,
  type ProposalPage,
  type ProposalVersionSnapshot,
  type RichTextValue,
  TIMELINE_PHASE_LIMIT,
  TRANCHE_LINE_LIMIT,
  type TrancheLine,
} from '@heliogrid/domain';
import { createTranslator, provenanceWords } from '@heliogrid/i18n';
import { ProvenanceWordsProvider, ScaledProposalPage } from '@heliogrid/ui';
import { moneyOf } from '../support/proposal-document-money';
import { DATE_TEXT, NUMBER, versionOf } from '../support/proposal-document-sample';
import { pageWordsOf } from '../support/proposal-document-words';

/* A whole page of the document as it prints, for the pages' specs: the sample version, its parts swapped one at a time. */

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
};

/** The sample with each list a company may fill at its limit, as a busy company fills it. */
function atTheLimits(version: ProposalVersionSnapshot): ProposalVersionSnapshot {
  const phase = {
    name: 'N'.repeat(PROPOSAL_LIMITS.phaseName),
    description: 'Words '.repeat(PROPOSAL_LIMITS.phaseDescription / 6).trim(),
    durationDays: 30,
  };
  const share = basisPoints(Math.floor(10000 / TRANCHE_LINE_LIMIT));
  const tranches = Array.from(
    { length: TRANCHE_LINE_LIMIT },
    (_, index): TrancheLine => ({
      label: `Part ${index + 1} on the day the material reaches your site`,
      share: index === 0 ? basisPoints(10000 - share * (TRANCHE_LINE_LIMIT - 1)) : share,
      dueOnStage: 'dispatched',
    }),
  );
  return {
    ...version,
    fields: {
      ...version.fields,
      timeline: Array.from({ length: TIMELINE_PHASE_LIMIT }, () => phase),
      payment: { templateId: null, tranches },
    },
    money: moneyOf('drawn', tranches),
  };
}

/** One page of the document fitted to a width, over the sample version. */
export function PageAsPrinted({
  page,
  width,
  off = [],
  bare = false,
  emi = false,
  language = 'en',
  terms,
  validityDays,
  part,
  full = false,
  brandColour,
}: {
  page: ProposalPage;
  width: number;
  /** The optional pages this version's company switched off. */
  off?: ProposalPage[];
  /** A draft whose optional facts are absent: no number, no bank, no record, no generation. */
  bare?: boolean;
  /** The EMI example is on: the price page carries its block too. */
  emi?: boolean;
  language?: keyof typeof READERS;
  /** The company's own terms in place of the sample's — long ones print on more than one sheet. */
  terms?: RichTextValue;
  validityDays?: number;
  /** Which of the page's sheets, from 0. */
  part?: number;
  /** Every list at its limit, each line at its longest: 20 timeline steps, 12 payment parts. */
  full?: boolean;
  /** The company's brand colour in place of the sample's; `null` for a company with none. */
  brandColour?: string | null;
}) {
  const { t } = READERS[language];
  const drawn = full ? atTheLimits(versionOf(bare, emi, off)) : versionOf(bare, emi, off);
  const snapshot = {
    ...drawn,
    validityDays: validityDays ?? null,
    ...(terms === undefined ? {} : { fields: { ...drawn.fields, terms } }),
    ...(brandColour === undefined ? {} : { company: { ...drawn.company, brandColour } }),
  };
  return (
    <ProvenanceWordsProvider value={provenanceWords(t)}>
      <ScaledProposalPage
        page={page}
        {...(part === undefined ? {} : { part })}
        width={width}
        snapshot={snapshot}
        facts={{
          number: bare ? undefined : NUMBER,
          dateText: DATE_TEXT,
          generationTier: 'estimated',
        }}
        words={pageWordsOf(t, snapshot, bare)}
        still
      />
    </ProvenanceWordsProvider>
  );
}
