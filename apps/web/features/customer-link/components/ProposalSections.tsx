'use client';
import type { CustomerPageScreen, ProposalPageFactsRead } from '@heliogrid/data/react';
import type { CustomerProposalWords, proposalDocumentReadWords } from '@heliogrid/i18n';
import {
  ProposalEmiBlock,
  ProposalGenerationBlock,
  ProposalPartsBlock,
  ProposalPicture,
  ProposalPriceBlock,
  ProposalSavingsBlock,
  ProposalSplitBlock,
  ProposalTermsBlock,
  ProposalTimelineBlock,
  ProvenanceTier,
  useFormat,
} from '@heliogrid/ui';
import { PageCard } from './CustomerFrame';

type Snapshot = NonNullable<CustomerPageScreen['snapshot']>;
type BlockWords = ReturnType<typeof proposalDocumentReadWords>['blocks'];

/** The hero (`F5-07`): the cover picture, a greeting, and the three figures a homeowner decides on. */
export function ProposalHero({
  snapshot,
  coverSrc,
  taxName,
  words,
}: {
  snapshot: Snapshot;
  coverSrc: string | null;
  taxName: string;
  words: CustomerProposalWords;
}) {
  const format = useFormat();
  const { money, savings, fields } = snapshot;
  const cover = fields.company.coverPicture;
  const size = fields.system.capacityKw;
  const years = savings?.paybackYears ?? null;
  return (
    <ProposalPicture
      className="hg-cust-hero"
      shade="cover"
      {...(cover.kind === 'platform' ? { name: cover.key } : {})}
      {...(cover.kind === 'own' && coverSrc !== null ? { src: coverSrc } : {})}
    >
      <div className="hg-cust-hero-words">
        <span>{words.hello}</span>
        <h1>{words.title(size === null ? null : format.number(size))}</h1>
      </div>
      <dl className="hg-cust-hero-glass">
        <div>
          <dd>{format.moneyPlain(money.figures.payable.value)}</dd>
          <dt>{money.taxes.length === 0 ? words.hero.yourPrice : words.hero.withTax(taxName)}</dt>
          <HeroTier tier={money.figures.payable.tier} />
        </div>
        {savings === null ? null : (
          <div>
            <dd>{format.moneyPlain(savings.figures.monthly.value)}</dd>
            <dt>{words.hero.savedMonth}</dt>
            <HeroTier tier={savings.figures.monthly.tier} />
          </div>
        )}
        {years === null ? null : (
          <div>
            <dd>
              {words.hero.paybackValue(
                format.number(years, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
              )}
            </dd>
            <dt>{words.hero.payback}</dt>
          </div>
        )}
      </dl>
    </ProposalPicture>
  );
}

/** A money figure's tier on the glass, under its label (`F5-36`); a duration carries none. */
function HeroTier({ tier }: { tier: Snapshot['money']['figures']['payable']['tier'] }) {
  return (
    <dd className="hg-cust-hero-tier">
      <ProvenanceTier tier={tier} />
    </dd>
  );
}

/**
 * The proposal's cards (`F5-32`), each drawn by the document's own part in its `link` voice — so a
 * figure, its tier, its source label and its disclosure line are the PDF's, to the word (`F5-38`).
 * A card whose fact the version does not hold is left out; nothing prints a placeholder.
 */
export function ProposalCards({
  snapshot,
  categories,
  logoSrc,
  blocks,
  generationTier,
  words,
}: {
  snapshot: Snapshot;
  categories: CustomerPageScreen['categories'];
  logoSrc: string | null;
  blocks: BlockWords;
  generationTier: ProposalPageFactsRead['generationTier'];
  words: CustomerProposalWords;
}) {
  const { money, savings, generation, emi, fields, deal } = snapshot;
  /* A page the company switched off is left out here as in the document (`T-M01-030`); the price
     and the terms always print. */
  const prints = (page: Snapshot['pages'][number]) => snapshot.pages.includes(page);
  return (
    <>
      <PageCard glass section="price">
        <ProposalPriceBlock mode="link" money={money} words={blocks.price} />
      </PageCard>
      {savings === null || !prints('savings') ? null : (
        <PageCard section="savings">
          <ProposalSavingsBlock
            mode="link"
            savings={savings}
            money={money}
            monthlyBill={deal.monthlyBill}
            words={blocks.savings}
          />
        </PageCard>
      )}
      {generation === null || !prints('generation') ? null : (
        <PageCard section="generation">
          <ProposalGenerationBlock
            mode="link"
            generation={generation}
            tier={generationTier}
            words={blocks.generation}
          />
        </PageCard>
      )}
      {prints('system') ? (
        <PageCard title={words.cards.parts} section="parts">
          <ProposalPartsBlock
            mode="link"
            categories={categories}
            components={fields.components}
            words={blocks.parts}
          />
        </PageCard>
      ) : null}
      <PageCard section="payment">
        <ProposalSplitBlock
          mode="link"
          tranches={fields.payment.tranches}
          amounts={money.tranches}
          words={blocks.split}
        />
      </PageCard>
      {emi === null ? null : (
        <PageCard title={words.cards.emi}>
          <ProposalEmiBlock mode="link" emi={emi} savings={savings} words={blocks.emi} />
        </PageCard>
      )}
      {fields.timeline.length === 0 || !prints('timeline') ? null : (
        <PageCard title={words.cards.timeline} section="timeline">
          <ProposalTimelineBlock mode="link" phases={fields.timeline} words={blocks.timeline} />
        </PageCard>
      )}
      <PageCard title={words.cards.terms} section="terms">
        <ProposalTermsBlock
          mode="link"
          terms={fields.terms}
          {...(logoSrc === null ? {} : { logoSrc })}
          words={blocks.terms}
        />
      </PageCard>
    </>
  );
}
