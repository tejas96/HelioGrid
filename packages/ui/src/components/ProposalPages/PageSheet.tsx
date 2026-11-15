import type { CSSProperties, ReactNode } from 'react';
import { CustomerSurface } from '../CustomerSurface';
import { ProposalPicture } from '../ProposalPicture';
import { TenantMark } from '../TenantHeader';
import { sheetPlace } from './ProposalPages.logic';
import type { PageFrame } from './ProposalPages.plan';
import type { ProposalPageProps } from './ProposalPages.types';
import { useFittedBody } from './use-fitted-body';

type PageVars = CSSProperties & Record<`--${string}`, string>;

/**
 * The tenant's colour as the document may carry it (`F5-81`, `F7-07`): the mark's own pair, and
 * the compliant shade for the accents — never the raw colour under a word. Branding is
 * presentation; it changes no number, label or disclosure.
 */
export function brandVars(brandColor: string | undefined): PageVars {
  const tokens = CustomerSurface.tokens(brandColor);
  if (tokens === null) return {};
  const pick = (name: string): string => tokens[name] ?? '';
  return {
    '--tenant-mark': pick('--tenant-mark'),
    '--tenant-mark-on': pick('--tenant-mark-on'),
    '--accent': pick('--accent'),
    '--accent-text': pick('--accent-hover'),
    '--accent-subtle': pick('--accent-subtle'),
  };
}

export interface PageSheetProps extends ProposalPageProps, PageFrame {
  children: ReactNode;
}

/**
 * One inner page of the document at its design size: the company and the version at its head, the
 * title with the brand rule, an optional lead, the body, and the foot with the page's number among
 * the pages that print.
 */
export function PageSheet({
  page,
  part,
  snapshot,
  facts,
  words,
  still = false,
  lead,
  band,
  tone,
  children,
}: PageSheetProps) {
  const { company } = snapshot;
  const title = words.titles[page];
  const { number, count } = sheetPlace({ page, part, snapshot });
  const [room, body, fit] = useFittedBody();
  const fitVars: PageVars = fit === 1 ? {} : { '--hg-pp-fit': `${fit}` };
  return (
    <article
      className="hg-pp"
      data-paper=""
      data-page={page}
      data-tone={tone}
      data-band={band === undefined ? undefined : ''}
      data-still={still ? '' : undefined}
      aria-label={words.pageName(title, number, count)}
      style={brandVars(company.brandColour ?? undefined)}
    >
      {band === undefined ? null : <ProposalPicture name={band} className="hg-pp-band" />}
      <header className="hg-pp-head">
        <span className="hg-pp-head-company">
          <TenantMark
            logo={facts.logoSrc}
            name={company.name}
            size={26}
            radius={8}
            showName={false}
          />
          {company.name}
        </span>
        <span className="hg-pb-mono">{words.head}</span>
      </header>
      <h2 className="hg-pp-title">{title}</h2>
      <i className="hg-pp-rule" />
      {lead === undefined || lead === null ? null : <p className="hg-pp-lead">{lead}</p>}
      <div className="hg-pp-body" ref={room}>
        <div
          className="hg-pp-body-fit"
          ref={body}
          data-fitted={fit === 1 ? undefined : ''}
          style={fitVars}
        >
          {children}
        </div>
      </div>
      <footer className="hg-pp-foot">
        <span>{words.foot ?? snapshot.deal.clientName}</span>
        <span className="hg-pb-mono">{`${number} / ${count}`}</span>
      </footer>
    </article>
  );
}
