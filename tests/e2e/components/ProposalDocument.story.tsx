import type { ComponentCategory } from '@heliogrid/domain';
import { createTranslator, provenanceWords } from '@heliogrid/i18n';
import {
  ProposalBankBlock,
  type ProposalBlockMode,
  ProposalCompanyBlock,
  ProposalEmiBlock,
  ProposalGenerationBlock,
  ProposalPartsBlock,
  ProposalPriceBlock,
  ProposalSavingsBlock,
  ProposalSplitBlock,
  ProposalTermsBlock,
  ProposalTimelineBlock,
  ProposalTrackRecordBlock,
  ProvenanceWordsProvider,
} from '@heliogrid/ui';
import { useState } from 'react';
import {
  moneyOf,
  TRANCHES,
  TRANCHES_LONG,
  TRANCHES_SHORT,
} from '../support/proposal-document-money';
import { COMPANY, CUSTOMER, EMI, SNAPSHOT } from '../support/proposal-document-sample';
import { blockWordsOf } from '../support/proposal-document-words';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
};

export type StoryBlock =
  | 'price'
  | 'generation'
  | 'savings'
  | 'emi'
  | 'split'
  | 'parts'
  | 'timeline'
  | 'record'
  | 'company'
  | 'terms'
  | 'bank';

export type StoryCase = 'drawn' | 'owner' | 'belowZero' | 'noTax' | 'short' | 'long' | 'notPrinted';

type StoryWords = ReturnType<typeof blockWordsOf>;

/** The categories this proposal must fill: the five every proposal does. */
const CATEGORIES: readonly ComponentCategory[] = [
  'panel',
  'inverter',
  'cable',
  'electrical',
  'structure',
];

const COMPANY_FACTS = {
  name: COMPANY,
  address: 'Shop 14, Laxmi Complex, Baner Road, Pune 411045',
  taxId: 'GSTIN 27AABCS1429P1ZQ',
  customerName: CUSTOMER,
  siteAddress: '12, Shivtirth Nagar, Kothrud, Pune 411038',
};

const tranchesOf = (kase: StoryCase) =>
  kase === 'short' ? TRANCHES_SHORT : kase === 'long' ? TRANCHES_LONG : TRANCHES;

/** The blocks that draw the money and the energy. */
function FigureBlock({
  block,
  mode,
  kase,
  words,
}: {
  block: StoryBlock;
  mode: ProposalBlockMode;
  kase: StoryCase;
  words: StoryWords;
}) {
  const { generation, savings, deal } = SNAPSHOT;
  if (generation === null || savings === null) return null;
  const moneyCase = kase === 'owner' || kase === 'belowZero' || kase === 'noTax' ? kase : 'drawn';
  const money = moneyOf(moneyCase, tranchesOf(kase));
  switch (block) {
    case 'price':
      return <ProposalPriceBlock mode={mode} money={money} words={words.price} />;
    case 'generation':
      return (
        <ProposalGenerationBlock
          mode={mode}
          generation={generation}
          tier="estimated"
          words={words.generation}
        />
      );
    case 'savings':
      return (
        <ProposalSavingsBlock
          mode={mode}
          savings={savings}
          money={money}
          monthlyBill={deal.monthlyBill}
          words={words.savings}
        />
      );
    case 'emi':
      return <ProposalEmiBlock mode={mode} emi={EMI} savings={savings} words={words.emi} />;
    case 'split':
      return (
        <ProposalSplitBlock
          mode={mode}
          tranches={tranchesOf(kase)}
          amounts={money.tranches}
          words={words.split}
        />
      );
    default:
      return null;
  }
}

/** The blocks that draw the company's own facts. */
function FactBlock({
  block,
  mode,
  kase,
  words,
  onPick,
}: {
  block: StoryBlock;
  mode: ProposalBlockMode;
  kase: StoryCase;
  words: StoryWords;
  onPick: (category: ComponentCategory) => void;
}) {
  const { fields, company } = SNAPSHOT;
  if (company.bankDetails === null) return null;
  switch (block) {
    case 'parts':
      return (
        <ProposalPartsBlock
          mode={mode}
          categories={CATEGORIES}
          components={fields.components}
          words={words.parts}
          onPick={onPick}
        />
      );
    case 'timeline':
      return <ProposalTimelineBlock mode={mode} phases={fields.timeline} words={words.timeline} />;
    case 'record':
      return (
        <ProposalTrackRecordBlock mode={mode} record={fields.achievements} words={words.record} />
      );
    case 'company':
      return <ProposalCompanyBlock mode={mode} company={COMPANY_FACTS} words={words.company} />;
    case 'terms':
      return <ProposalTermsBlock mode={mode} terms={fields.terms} words={words.terms} />;
    case 'bank':
      return (
        <ProposalBankBlock
          mode={mode}
          bank={company.bankDetails}
          notPrinted={kase === 'notPrinted'}
          words={words.bank}
        />
      );
    default:
      return null;
  }
}

/** One block on the ground its mode stands on, with the category a press picked beside it. */
export function BlockAsDrawn({
  block,
  mode,
  kase = 'drawn',
  language = 'en',
}: {
  block: StoryBlock;
  mode: ProposalBlockMode;
  kase?: StoryCase;
  language?: keyof typeof READERS;
}) {
  const [picked, setPicked] = useState('');
  const { t } = READERS[language];
  const words = blockWordsOf(t, mode === 'app' ? 'builder' : 'customer', SNAPSHOT);
  return (
    <ProvenanceWordsProvider value={provenanceWords(t)}>
      <div data-paper={mode === 'paper' ? '' : undefined} data-testid="block">
        <FigureBlock block={block} mode={mode} kase={kase} words={words} />
        <FactBlock block={block} mode={mode} kase={kase} words={words} onPick={setPicked} />
      </div>
      <output data-testid="picked">{picked}</output>
    </ProvenanceWordsProvider>
  );
}
