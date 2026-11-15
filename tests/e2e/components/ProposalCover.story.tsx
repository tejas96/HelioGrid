import { createTranslator, proposalCoverWords, provenanceWords } from '@heliogrid/i18n';
import { ProvenanceWordsProvider, ScaledProposalPage } from '@heliogrid/ui';
import { DATE_TEXT, SNAPSHOT, TAX_NAME } from '../support/proposal-document-sample';
import { format } from '../support/proposal-document-words';

const { t } = await createTranslator('en');

/** A draft before its price and its generation: no figure exists yet, the rest stands. */
export const BEFORE_PRICE = {
  ...SNAPSHOT,
  money: null,
  generation: null,
  savings: null,
  emi: null,
};

/**
 * A draft's cover before its price is typed (`M06-51`), as the builder's step-1 peek draws it: the
 * picture, the customer and the system line, and no figure on glass.
 */
export function CoverBeforePrice({ width }: { width: number }) {
  return (
    <ProvenanceWordsProvider value={provenanceWords(t)}>
      <ScaledProposalPage
        page="cover"
        width={width}
        snapshot={BEFORE_PRICE}
        facts={{ dateText: DATE_TEXT, generationTier: 'estimated' }}
        words={proposalCoverWords(t, { snapshot: BEFORE_PRICE, format, taxName: TAX_NAME })}
        still
      />
    </ProvenanceWordsProvider>
  );
}
