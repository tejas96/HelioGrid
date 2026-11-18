'use client';
import type { DesignDetail } from '@heliogrid/contracts';
import { useDesignScreen } from '@heliogrid/data/react';
import { designPageWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, LeadDetailStates, StateRegion, useOwnWidth } from '@heliogrid/ui';
import { SITE_DETAILS_WIDE_FROM } from './constants';
import { StudioPageHead } from './StudioPageHead';
import { type StudioMoves, useStudioMoves } from './use-studio-moves';
import { useStudioSubject } from './use-studio-subject';

import './studio.css';

/**
 * One design's own page on the web (`SCR-M05-02`): where the studio opens. Until the roof step is
 * built it names the design, says who it is for and where the site is, and says plainly what comes
 * next — with the way to the Site details for a reader who may change them.
 */
export function DesignScreen({
  designId,
  fromProposals = false,
}: {
  designId: string;
  /** The Proposals page opened it: the way back returns there (`T-M05-001b`). */
  fromProposals?: boolean;
}) {
  const t = useTranslate();
  const moves = useStudioMoves();
  const { read } = useDesignScreen(designId);
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const detail = read.kind === 'ready' ? read.value : null;
  const { page, lead, summary } = useStudioSubject(detail?.subject ?? null);
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target hg-studio-page">
      <StudioPageHead
        wide={width !== null && width >= SITE_DETAILS_WIDE_FROM}
        label={page.trail}
        leads={page.leads}
        lead={lead}
        title={detail === null ? page.title : designPageWords(t).named(detail.design.ordinal)}
        summary={summary}
        onLeads={moves.toLeads}
        onLead={() => {
          if (detail !== null) moves.toLead(detail.subject.leadId);
        }}
        fromProposals={fromProposals ? { label: page.proposals, onOpen: moves.toProposals } : null}
      />
      {read.kind === 'ready' ? (
        <DesignHolding detail={read.value} moves={moves} fromProposals={fromProposals} />
      ) : (
        <LeadDetailStates
          read={read}
          words={page.states}
          onBackToList={moves.toLeads}
          focusAfter={room}
        />
      )}
    </div>
  );
}

/** What stands where the studio will: the site, what comes next, and the one way on. */
function DesignHolding({
  detail,
  moves,
  fromProposals,
}: {
  detail: DesignDetail;
  moves: StudioMoves;
  fromProposals: boolean;
}) {
  const words = designPageWords(useTranslate());
  const { design, site, subject } = detail;
  return (
    <StateRegion
      glyph="solar-panel"
      scene="settle"
      title={words.holdingTitle}
      message={
        <>
          {site.address === null ? null : <span className="hg-studio-site">{site.address}</span>}
          <span>{words.holdingLine(design.mount, site.pin !== null)}</span>
        </>
      }
      action={
        detail.canEdit ? (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => moves.toSiteDetails(design.id, fromProposals)}
          >
            {words.editSite}
          </Button>
        ) : (
          <Button variant="secondary" size="lg" onClick={() => moves.toLead(subject.leadId)}>
            {words.backToLead}
          </Button>
        )
      }
    />
  );
}
