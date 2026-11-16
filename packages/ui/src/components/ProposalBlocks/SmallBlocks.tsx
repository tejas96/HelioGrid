import type { CSSProperties } from 'react';
import { HueTile } from '../HueTile';
import { useFormat } from '../MarketProvider/market-context';
import { ProvenanceTier } from '../Provenance';
import { RichTextView } from '../RichText';
import type { RichTextValue as ViewValue } from '../RichText/RichText.types';
import { TenantMark } from '../TenantHeader';
import { BlockFigure } from './BlockParts';
import {
  accountShown,
  bankRouting,
  phaseViews,
  recordCells,
  termsShown,
} from './ProposalBlocks.facts';
import { riseOrder } from './ProposalBlocks.logic';
import type {
  ProposalBankBlockProps,
  ProposalCompanyBlockProps,
  ProposalTermsBlockProps,
  ProposalTimelineBlockProps,
  ProposalTrackRecordBlockProps,
} from './ProposalBlocks.types';

type RowVars = CSSProperties & Record<`--${string}`, number>;

/**
 * From today to switch-on (`M06-12`): the company's own steps in order, numbered and joined by a
 * line, each with its sentence and how long it takes.
 */
export function ProposalTimelineBlock({
  mode,
  phases,
  before = 0,
  words,
}: ProposalTimelineBlockProps) {
  return (
    <div className="hg-pb hg-pb-time" data-mode={mode}>
      <ol className="hg-pb-time-list">
        {phaseViews(phases, words).map((phase, index) => {
          const vars: RowVars = { '--i': riseOrder(index) };
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: a timeline's steps keep their order and may repeat a name
            <li key={index} className="hg-pb-time-step" style={vars}>
              <span className="hg-pb-time-number" aria-hidden="true">
                {before + index + 1}
              </span>
              <span className="hg-pb-time-words">
                <b>{phase.title}</b>
                <span>{phase.note}</span>
              </span>
              {phase.duration === null ? null : (
                <span className="hg-pb-time-days">{phase.duration}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** The company's track record (`M06-08`): its counts, each over its own words. */
export function ProposalTrackRecordBlock({ mode, record, words }: ProposalTrackRecordBlockProps) {
  const cells = recordCells(record, words, useFormat());
  if (cells.length === 0) return null;
  return (
    <div className="hg-pb hg-pb-record" data-mode={mode}>
      <div className="hg-pb-record-row">
        {cells.map((cell) => (
          <div key={cell.name}>
            <BlockFigure figure={cell.figure} size="display" />
            <span className="hg-pb-unit">{cell.name}</span>
            {cell.tier === undefined ? null : <ProvenanceTier tier={cell.tier} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Who the proposal is from and who it is for (`M06-07`, `M06-16`): the company's mark, name,
 * address and tax registration, then the customer, the site, the number and how they take the
 * system. A fact the company has not given is left out; nothing stands in for it (`M06-17`).
 */
export function ProposalCompanyBlock({ mode, company, words }: ProposalCompanyBlockProps) {
  return (
    <div className="hg-pb hg-pb-company" data-mode={mode}>
      <div className="hg-pb-company-band">
        <TenantMark logo={company.logoSrc} name={company.name} size={44} showName={false} />
        <span className="hg-pb-company-words">
          <b>{company.name}</b>
          {company.address === undefined ? null : <span>{company.address}</span>}
          {company.taxId === undefined ? null : <span className="hg-pb-mono">{company.taxId}</span>}
        </span>
      </div>
      <div className="hg-pb-company-foot">
        <span className="hg-pb-company-for">
          <span className="hg-pb-over hg-overline">{words.proposalOverline}</span>
          <b>{company.customerName}</b>
          {company.siteAddress === undefined ? null : <span>{company.siteAddress}</span>}
        </span>
        <span className="hg-pb-company-meta">
          <b className="hg-pb-mono">{company.number ?? words.draft}</b>
          <span>{words.type}</span>
        </span>
      </div>
    </div>
  );
}

/** The version's terms, as the company wrote them (`M06-15`) — read, never edited, here. */
export function ProposalTermsBlock({ mode, terms, logoSrc, words }: ProposalTermsBlockProps) {
  return (
    <div className="hg-pb hg-pb-terms" data-mode={mode}>
      <RichTextView
        value={termsShown(terms, logoSrc) as ViewValue}
        logoSrc={logoSrc}
        logoLabel={words.logoLabel}
        fontSize={mode === 'paper' ? 16 : 14}
      />
    </div>
  );
}

/**
 * Where the customer pays (`M06-17`): the company's own account, as the business profile holds it.
 * A proposal that does not print it shows the block dimmed, with its line, to the person building.
 */
export function ProposalBankBlock({
  mode,
  bank,
  notPrinted = false,
  words,
}: ProposalBankBlockProps) {
  const format = useFormat();
  const off = mode === 'app' && notPrinted;
  return (
    <div className="hg-pb hg-pb-bank" data-mode={mode} data-off={off ? '' : undefined}>
      <HueTile glyph="credit-card" hue="teal" size={44} />
      <div className="hg-pb-bank-words">
        <b>{bank.bankName}</b>
        <span>{bank.accountName}</span>
        <span className="hg-pb-mono">{words.account(accountShown(bank.accountNumber, mode))}</span>
        <span className="hg-pb-mono">{bankRouting(bank, format)}</span>
      </div>
      {off ? <span className="hg-pb-quiet-pill">{words.notPrinted}</span> : null}
    </div>
  );
}
