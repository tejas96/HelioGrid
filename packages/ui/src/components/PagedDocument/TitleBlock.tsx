import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider';
import { NamedGap } from '../NamedGap';
import type { TitleBlockProps } from './PagedDocument.types';

interface WebTitleBlockProps extends TitleBlockProps {
  className?: string;
  style?: CSSProperties;
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="hg-title-block-overline">{label}</p>
      <p className="hg-title-block-value">{value}</p>
    </div>
  );
}

/**
 * MS9-01's title block: "proposal number, issue date, version/revision, validity period,
 * prepared-by with company identity, and the CUSTOMER-FACING PROJECT NAME — never the internal
 * design or variant name."
 *
 * The last clause is a code fact, not a caution: `projectName` and `internalName` are two props,
 * and the customer branch never reads the second one.
 */
export function TitleBlock({
  projectName,
  internalName,
  customer,
  proposalNumber,
  issueDate,
  version,
  validUntil,
  preparedBy,
  docTitle = 'Solar proposal',
  audience = 'customer',
  className,
  style,
}: WebTitleBlockProps) {
  const mkt = useFormat();
  const pb = preparedBy ?? {};
  return (
    <header data-keep-together="" className={classNames('hg-title-block', className)} style={style}>
      <div className="hg-title-block-top">
        <div className="hg-title-block-identity">
          <p className="hg-title-block-overline">{docTitle}</p>
          {/* The customer-facing name, at document heading size. A missing one is a named gap —
              the product does not invent a project name, and it must not fall back to the
              design's. */}
          {projectName ? (
            <h1 className="hg-title-block-name">{projectName}</h1>
          ) : (
            <div className="hg-title-block-gap">
              <NamedGap gap="No project name yet" scale="headline" />
            </div>
          )}
          {customer && (
            <p className="hg-title-block-customer">
              <span className="hg-title-block-customer-name">{customer.name}</span>
              {customer.meta ? ` · ${customer.meta}` : ''}
            </p>
          )}
          {/* Only ever on the internal variant. MS9-04 keeps this off a customer artefact. */}
          {audience === 'internal' && internalName && (
            <p className="hg-title-block-internal">Internal design name · {internalName}</p>
          )}
        </div>
        <div className="hg-title-block-prepared">
          <p className="hg-title-block-company">{pb.company}</p>
          {(pb.lines ?? []).map((line) => (
            <p className="hg-title-block-line" key={line}>
              {line}
            </p>
          ))}
          {pb.person && (
            <p className="hg-title-block-person">
              Prepared by {pb.person}
              {pb.role ? ` · ${pb.role}` : ''}
            </p>
          )}
        </div>
      </div>
      <div className="hg-title-block-fields">
        <MetaField label="Proposal no." value={proposalNumber || '—'} />
        <MetaField label="Issued" value={issueDate ? mkt.date(issueDate) : '—'} />
        <MetaField label="Revision" value={version || '—'} />
        <MetaField label="Valid until" value={validUntil ? mkt.date(validUntil) : '—'} />
      </div>
    </header>
  );
}
