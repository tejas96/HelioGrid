'use client';
import type { DesignDetail } from '@heliogrid/contracts';
import { useLeaveAsk } from '@heliogrid/data/react';
import { useStudioScreen } from '@heliogrid/data/react/studio';
import { designPageWords, siteDetailsPageWords, studioCanvasWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  LeadDetailStates,
  LeaveConfirm,
  StateRegion,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { useLeaveGuard } from '../../lib/leave-guard';
import { inPhoneWebView, leaveToPhone, siteToPhone } from '../../lib/web-view-host';
import { StudioCanvas } from './components/StudioCanvas';
import { SITE_DETAILS_WIDE_FROM } from './constants';
import { usePhoneBack } from './hooks/use-phone-back';
import { StudioPageHead } from './StudioPageHead';
import { type StudioMoves, useStudioMoves } from './use-studio-moves';
import { useStudioSubject } from './use-studio-subject';

import './studio.css';
import './studio-canvas.css';
import './studio-picture.css';
import './studio-roof.css';
import './studio-roof-sides.css';
import './studio-roof-controls.css';
import './studio-length.css';
import './studio-height.css';
import './studio-motion.css';
import './studio-tools.css';
import './studio-focus.css';

/**
 * One design's own page (`SCR-M05-02`): the studio (`T-M05-002a`). It opens on the site in the flat
 * top view on its picture, with the pin; a design whose site has no place yet asks for Site details first.
 * Inside the phone app's web view the way back hands the person back to the phone.
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
  const format = useFormat();
  const studio = useStudioScreen(designId, format.pack);
  const frame = useRef<HTMLDivElement>(null);
  const { read } = studio;
  const page = siteDetailsPageWords(t);
  // A change still waiting to be sent is lost on leaving: the way back and the tab's close ask first.
  const leave = useLeaveAsk(() => {});
  useLeaveGuard(studio.unsent, leave.ask);
  const back = (leadId: string | null) => {
    const go = () => {
      if (inPhoneWebView()) leaveToPhone();
      else if (fromProposals) moves.toProposals();
      else if (leadId !== null) moves.toLead(leadId);
      else moves.toLeads();
    };
    if (studio.unsent) leave.ask(go);
    else go();
  };
  // The phone's system back: the leave ask closes first, then what is open; then the way back.
  usePhoneBack(() => {
    if (leave.asking) leave.stay();
    else if (!studio.moves.back()) back(read.kind === 'ready' ? read.value.subject.leadId : null);
  });
  if (read.kind !== 'ready') {
    return (
      <div ref={frame} tabIndex={-1} className="hg-shell-page hg-focus-target hg-studio-page">
        <LeadDetailStates
          read={read}
          words={page.states}
          onBackToList={() => back(null)}
          focusAfter={frame}
        />
      </div>
    );
  }
  const detail = read.value;
  if (detail.site.pin === null) {
    return <SiteFirst detail={detail} moves={moves} fromProposals={fromProposals} />;
  }
  const words = studioCanvasWords(t);
  const toSite = () => {
    if (inPhoneWebView()) siteToPhone();
    else moves.swapToSiteDetails(designId, fromProposals);
  };
  return (
    <>
      <StudioCanvas
        detail={detail}
        studio={studio}
        name={words.designName(detail.site.name, detail.design.ordinal)}
        words={words}
        onBack={() => back(detail.subject.leadId)}
        onSite={detail.canEdit ? toSite : null}
      />
      <LeaveConfirm
        open={leave.asking}
        title={page.leaveTitle}
        body={words.leaveUnsaved}
        discard={page.leaveConfirm}
        keep={page.keepEditing}
        onKeep={leave.stay}
        onLeave={leave.leave}
      />
    </>
  );
}

/**
 * A design whose site has no place yet: the studio has nothing to open on. The page names the
 * design and who it is for, says what comes next, and leads to Site details first.
 */
function SiteFirst({
  detail,
  moves,
  fromProposals,
}: {
  detail: DesignDetail;
  moves: StudioMoves;
  fromProposals: boolean;
}) {
  const words = designPageWords(useTranslate());
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const { page, lead, summary } = useStudioSubject(detail.subject);
  const { design, subject } = detail;
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target hg-studio-page">
      <StudioPageHead
        wide={width !== null && width >= SITE_DETAILS_WIDE_FROM}
        label={page.trail}
        leads={page.leads}
        lead={lead}
        title={words.named(design.ordinal)}
        summary={summary}
        onLeads={moves.toLeads}
        onLead={() => moves.toLead(subject.leadId)}
        fromProposals={fromProposals ? { label: page.proposals, onOpen: moves.toProposals } : null}
      />
      <StateRegion
        glyph="solar-panel"
        scene="settle"
        title={words.holdingTitle}
        message={words.holdingLine(design.mount, false)}
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
    </div>
  );
}
