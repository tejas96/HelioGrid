'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { LargeTitle, type PageCrumb, PageTrail } from '@heliogrid/ui';
import type { ReactNode } from 'react';

/**
 * A proposal page's head, the app's own pattern (`CLAUDE.md` §10): at the desktop's room the
 * breadcrumb above the title and no back button; below it one way back, the page's round acts at
 * the row's other end, and the large title under it.
 */
export function ProposalPageHead({
  wide,
  trail,
  here,
  label,
  title,
  summary,
  mono = false,
  acts,
  barActs,
}: {
  wide: boolean;
  trail: readonly PageCrumb[];
  /** This page as the trail names it. */
  here: string;
  label: TranslatedText;
  title: TranslatedText;
  summary?: TranslatedText;
  /** The title is a record's number: set in the mono face. */
  mono?: boolean;
  /** The page's worded acts, beside the title at the desktop's room. */
  acts?: ReactNode;
  /** The same acts as round icons, in the way-back row below it. */
  barActs?: ReactNode;
}) {
  return (
    <div className="hg-proposal-head">
      <PageTrail
        trail={trail}
        here={here}
        label={label}
        narrow={!wide}
        acts={wide ? null : barActs}
      />
      <div className="hg-proposal-head-row" data-mono={mono ? 'true' : undefined}>
        <LargeTitle title={title} summary={summary} nameTitle />
        {wide && acts !== undefined ? <div className="hg-proposal-head-acts">{acts}</div> : null}
      </div>
    </div>
  );
}
