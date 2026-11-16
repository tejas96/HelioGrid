'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { useLanguageChoice } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  Card,
  CardHeader,
  CustomerSurface,
  DoorLanguage,
  TenantHeader,
  TintedBlock,
} from '@heliogrid/ui';
import type { ReactNode, Ref } from 'react';

/** The company as the page dresses itself (`F5-81`): its name, its mark and its colour. */
export interface FrameCompany {
  readonly name: string;
  readonly logoUrl: string | null;
  readonly brandColour: string | null;
}

/**
 * Every page of the customer's link (`SCR-F5-01`…`04`): the company's surface — its mark, its name
 * and the shades derived from its colour, in light and in dark — a column that is one hand wide on
 * a phone and two columns at the desktop's room, and the bar that stays in thumb reach.
 */
export function CustomerFrame({
  company,
  main,
  side,
  bar,
  after,
  centred = false,
  pageRef,
}: {
  /** `null` for an address whose company the page never learned (the busy page). */
  company: FrameCompany | null;
  main: ReactNode;
  /** The desktop's second column; on a phone it follows `main`. */
  side?: ReactNode;
  /** The phone's floating bar. The desktop's acts sit in `side`. */
  bar?: ReactNode;
  /** What the sheets draw; they leave the page's flow. */
  after?: ReactNode;
  /** The link-off page: one centred column and no second one. */
  centred?: boolean;
  pageRef?: Ref<HTMLDivElement>;
}) {
  const page = (
    <div className="hg-cust" data-centred={centred || undefined} ref={pageRef}>
      <div className="hg-cust-column">
        {company === null ? null : <BrandRow company={company} />}
        <div className="hg-cust-grid" data-one={side === undefined || undefined}>
          <main className="hg-cust-main">{main}</main>
          {side === undefined ? null : <aside className="hg-cust-side">{side}</aside>}
        </div>
      </div>
      {bar === undefined ? null : <div className="hg-cust-bar">{bar}</div>}
      {after}
    </div>
  );
  return (
    <CustomerSurface
      {...(company?.brandColour ? { brandColor: company.brandColour } : {})}
      {...(company === null ? {} : { tenantName: company.name })}
      fullHeight
    >
      {page}
    </CustomerSurface>
  );
}

/** The company's mark in the brand row: a phone's top line, beside the language pill. */
const BRAND_MARK = theme.spacing['sp-8'] + theme.spacing['sp-1'];

function BrandRow({ company }: { company: FrameCompany }) {
  return (
    <TenantHeader
      className="hg-cust-top"
      name={company.name}
      size={BRAND_MARK}
      {...(company.logoUrl === null ? {} : { logo: company.logoUrl })}
      actions={<DoorLanguage {...useLanguageChoice()} />}
    />
  );
}

/** A card of the page: a titled section the reader scans by its heading. */
export function PageCard({
  title,
  glass = false,
  section,
  children,
}: {
  title?: TranslatedText;
  /** A summary card — the price, the next step: the glass tile, not the white card. */
  glass?: boolean;
  /** The section a view of this card is timed as (`LINK_SECTIONS`). */
  section?: string;
  children: ReactNode;
}) {
  return (
    <Card
      as="section"
      surface={glass ? 'tile' : 'raised'}
      tile={glass ? 'glass' : 'solid'}
      className="hg-cust-card"
      data-link-section={section}
    >
      {title === undefined ? null : <CardHeader title={title} face="display" />}
      {children}
    </Card>
  );
}

/** A calm note on the page: what the customer answered, or what happened to the project. */
export function PageNote({
  tone,
  title,
  children,
  moment,
  noteRef,
}: {
  tone: 'success' | 'neutral' | 'info';
  title: TranslatedText;
  children?: ReactNode;
  moment?: ReactNode;
  /** Where focus lands once the act this note answers has gone (`F7-23` N5). */
  noteRef?: Ref<HTMLDivElement>;
}) {
  return (
    <TintedBlock tone={tone} title={title} face="display" rise blockRef={noteRef}>
      {moment}
      {children}
    </TintedBlock>
  );
}
