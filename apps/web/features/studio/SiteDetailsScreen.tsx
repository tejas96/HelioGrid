'use client';
import {
  type SiteDetailsShown,
  type SiteDetailsScreen as SiteDetailsView,
  useSiteDetailsScreen,
} from '@heliogrid/data/react';
import { type siteDetailsPageWords, siteDetailsWords, studioCanvasWords } from '@heliogrid/i18n';
import { useI18n, useTranslate } from '@heliogrid/i18n/react';
import {
  LeadDetailStates,
  LeaveConfirm,
  SiteDetails,
  type SiteDetailsActs,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import { type ReactNode, useEffect } from 'react';
import { useGuardedMove, useLeaveGuard } from '../../lib/leave-guard';
import { sitePinTilesOf } from './components/SitePinTiles';
import { SITE_DETAILS_WIDE_FROM } from './constants';
import { StudioPageHead } from './StudioPageHead';
import { useStudioMoves } from './use-studio-moves';
import { useStudioSubject } from './use-studio-subject';

import './studio.css';

/** What each control of the form reports, as the screen's hook answers it. */
function actsOf(screen: SiteDetailsView, onCancel: () => void): SiteDetailsActs {
  const { acts } = screen;
  return {
    onName: acts.name,
    onMount: acts.mount,
    onMode: acts.mode,
    onAddress: acts.address,
    onPickPlace: acts.pickPlace,
    onLatitude: acts.latitude,
    onLongitude: acts.longitude,
    onCoordinatesRead: acts.readCoordinates,
    onPaste: acts.paste,
    onPutBack: acts.putBack,
    onArea: acts.area,
    onOperator: acts.operator,
    onPhase: acts.phase,
    onLoad: acts.load,
    onCancel,
    onStart: screen.start,
  };
}

/**
 * Site details on the web (`SCR-M05-01`): for a rep who starts a design and confirms the place
 * first — the address the lead already holds is there, the pin is moved to the right roof, and one
 * button starts the design. What is read, decided and saved is `useSiteDetailsScreen`'s, the
 * phone's too; the web's own parts are the width, the router and the leave ask.
 */
export function SiteDetailsScreen({
  designId,
  fromProposals = false,
}: {
  designId: string;
  /** *With 3D design* on the Proposals page made it: Cancel returns there (`T-M05-001b`). */
  fromProposals?: boolean;
}) {
  const { locale } = useI18n();
  const format = useFormat();
  const moves = useStudioMoves();
  const guarded = useGuardedMove();
  const screen = useSiteDetailsScreen(
    designId,
    { formats: format.pack, language: locale },
    { toDesign: (id) => moves.toDesign(id, fromProposals) },
  );
  useLeaveGuard(screen.changed, screen.leave.ask);
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= SITE_DETAILS_WIDE_FROM;
  const { read } = screen;
  const shown = read.kind === 'ready' ? read.value : null;
  const { page, lead, summary } = useStudioSubject(shown?.detail.subject ?? null);
  /* A reader without the design grant has nothing to fill here: the design's own page shows the site. */
  const locked = shown !== null && !shown.detail.canEdit;
  const { toDesign } = moves;
  useEffect(() => {
    if (locked) toDesign(designId, fromProposals);
  }, [locked, toDesign, designId, fromProposals]);
  const toLead = () => {
    if (shown !== null) guarded(() => moves.toLead(shown.detail.subject.leadId));
  };
  /* A started design's form opened in the studio's place: Cancel opens the studio again. */
  const cancel = shown?.started
    ? () => guarded(() => toDesign(designId, fromProposals))
    : fromProposals
      ? () => guarded(moves.toProposals)
      : toLead;
  const canvas = studioCanvasWords(useTranslate());
  const head = (
    <StudioPageHead
      wide={wide}
      label={page.trail}
      leads={page.leads}
      lead={lead}
      title={page.title}
      summary={summary}
      onLeads={() => guarded(moves.toLeads)}
      onLead={toLead}
      fromProposals={
        fromProposals ? { label: page.proposals, onOpen: () => guarded(moves.toProposals) } : null
      }
      design={
        shown?.started
          ? {
              label: canvas.designName(shown.detail.site.name, shown.detail.design.ordinal),
              onOpen: cancel,
            }
          : null
      }
    />
  );
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target hg-studio-page">
      {read.kind === 'ready' && !locked ? (
        <SiteDetailsForm
          screen={screen}
          shown={read.value}
          wide={wide}
          head={head}
          onCancel={cancel}
        />
      ) : (
        <>
          {head}
          <LeadDetailStates
            read={read.kind === 'ready' ? { kind: 'loading' } : read}
            words={page.states}
            onBackToList={moves.toLeads}
            focusAfter={room}
          />
        </>
      )}
      <LeaveConfirm
        open={screen.leave.asking}
        title={page.leaveTitle}
        body={page.leaveBody}
        discard={page.leaveConfirm}
        keep={page.keepEditing}
        onKeep={screen.leave.stay}
        onLeave={screen.leave.leave}
      />
      <RoofsOffSite ask={screen.roofsOffSite} words={page.roofsOffSite} />
    </div>
  );
}

/** The form once its design is read, with the web's live map under its pin where a browser key is set. */
function SiteDetailsForm({
  screen,
  shown,
  wide,
  head,
  onCancel,
}: {
  screen: SiteDetailsView;
  shown: SiteDetailsShown;
  wide: boolean;
  /** The page's head, drawn on the form's own column. */
  head: ReactNode;
  onCancel: () => void;
}) {
  const t = useTranslate();
  const { page } = useStudioSubject(null);
  return (
    <SiteDetails
      room={wide ? 'wide' : 'narrow'}
      head={head}
      form={shown.form}
      areas={shown.areas}
      operators={shown.operators}
      search={shown.search}
      pinMoved={shown.pinMoved}
      pin={shown.pin}
      map={{
        tiles: sitePinTilesOf(shown.form.pin, screen.acts.movePin, screen.map),
        read: screen.map.read,
        big: screen.map.big,
        onBig: screen.map.open,
        onSmall: screen.map.close,
      }}
      saving={screen.saving}
      failure={screen.failure === null ? null : page.saveFailed(screen.failure)}
      acts={actsOf(screen, onCancel)}
      words={siteDetailsWords(t, shown.started)}
    />
  );
}

/** The pin moved to another site: the same two-answer ask, its destructive answer the move. */
function RoofsOffSite({
  ask,
  words,
}: {
  ask: SiteDetailsView['roofsOffSite'];
  words: ReturnType<typeof siteDetailsPageWords>['roofsOffSite'];
}) {
  return (
    <LeaveConfirm
      open={ask.asking}
      title={words.title}
      body={words.body}
      discard={words.remove}
      keep={words.keep}
      onKeep={ask.keep}
      onLeave={ask.remove}
    />
  );
}
