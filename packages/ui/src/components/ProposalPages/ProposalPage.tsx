import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import {
  ProposalBankBlock,
  ProposalEmiBlock,
  ProposalGenerationBlock,
  ProposalPartsBlock,
  ProposalPriceBlock,
  ProposalSavingsBlock,
  ProposalSplitBlock,
  ProposalTermsBlock,
  ProposalTimelineBlock,
  ProposalTrackRecordBlock,
} from '../ProposalBlocks';
import { ProposalPicture } from '../ProposalPicture';
import { CoverPage } from './CoverPage';
import { PageSheet } from './PageSheet';
import { fittedPage } from './ProposalPages.logic';
import { pageFrame, paperBlock, priceSheetOf } from './ProposalPages.plan';
import type {
  AnyProposalPageProps,
  ProposalPageProps,
  ScaledProposalPageProps,
} from './ProposalPages.types';

type ScaleVars = CSSProperties & Record<`--${string}`, string>;

function AboutBody(props: ProposalPageProps) {
  return (
    <>
      <div className="hg-pp-collage">
        <ProposalPicture name="site" className="hg-pp-collage-tall" />
        <ProposalPicture name="roof" />
        <ProposalPicture name="dusk" />
      </div>
      <ProposalTrackRecordBlock {...paperBlock.record(props)} />
    </>
  );
}

function PriceBody(props: ProposalPageProps) {
  const { words } = props;
  const sheet = priceSheetOf(props.snapshot, props.part ?? 0);
  const split = paperBlock.split(props);
  const emi = paperBlock.emi(props);
  return (
    <>
      {sheet.price ? <ProposalPriceBlock {...paperBlock.price(props)} /> : null}
      {split && <ProposalSplitBlock {...split} />}
      {emi && <ProposalEmiBlock {...emi} />}
      {!sheet.included || words.includedLines.length === 0 ? null : (
        <div className="hg-pp-included">
          <span className="hg-pb-over hg-overline">{words.included}</span>
          <ul>
            {words.includedLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function BankBody(props: ProposalPageProps) {
  const { words } = props;
  const bank = paperBlock.bank(props);
  return (
    <>
      {bank === null ? (
        <p className="hg-pp-lead">{words.bankAbsent}</p>
      ) : (
        <ProposalBankBlock {...bank} />
      )}
      <ProposalPicture name="evening" shade="foot" className="hg-pp-close">
        <div className="hg-pp-close-words">
          <b>{words.thanks}</b>
          {words.questions === undefined ? null : <span>{words.questions}</span>}
        </div>
      </ProposalPicture>
    </>
  );
}

/** A page's body: its blocks, each over the facts the plan reads for it. */
function PageBody(props: ProposalPageProps) {
  const generation = paperBlock.generation(props);
  const savings = paperBlock.savings(props);
  switch (props.page) {
    case 'about':
      return <AboutBody {...props} />;
    case 'price':
      return <PriceBody {...props} />;
    case 'bank':
      return <BankBody {...props} />;
    case 'system':
      return <ProposalPartsBlock {...paperBlock.parts(props)} />;
    case 'generation':
      return generation && <ProposalGenerationBlock {...generation} />;
    case 'savings':
      return savings && <ProposalSavingsBlock {...savings} />;
    case 'timeline':
      return <ProposalTimelineBlock {...paperBlock.timeline(props)} />;
    default:
      return <ProposalTermsBlock {...paperBlock.terms(props)} />;
  }
}

/**
 * One page of the proposal document at its design size (794 × 1123), drawn from the blocks in their
 * `paper` reading over the version's own facts — the same parts the builder, the customer's page and
 * the PDF draw (`M06-50`, `F5-38`). The caller scales it (`ScaledProposalPage`) or prints it.
 */
export function ProposalPage(props: AnyProposalPageProps) {
  if (props.page === 'cover') return <CoverPage {...props} />;
  return (
    <PageSheet {...props} {...pageFrame(props)}>
      <PageBody {...props} />
    </PageSheet>
  );
}

type WebScaledProposalPageProps = ScaledProposalPageProps & { className?: string };

/**
 * A page fitted to a width — a thumbnail, a stage, a reader: drawn at its design size and scaled as
 * a whole, so every width shows the same page. It is a picture of the page, not a second copy of
 * its words: nothing in it is focusable, and it is named once for a screen reader by its page.
 */
export function ScaledProposalPage({ width, className, ...page }: WebScaledProposalPageProps) {
  const { scale, height } = fittedPage(width);
  const vars: ScaleVars = {
    '--hg-pp-width': `${width}px`,
    '--hg-pp-height': `${height}px`,
    '--hg-pp-scale': `${scale}`,
  };
  return (
    <div className={classNames('hg-pp-fit', className)} style={vars}>
      <div className="hg-pp-fit-page">
        <ProposalPage {...page} />
      </div>
    </div>
  );
}
