import type { ProposalDetail, ProposalTracking } from '@heliogrid/contracts';
import { proposalSheetsOf, versionAwaitingShare } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import type { HueTileProps } from '../HueTile/HueTile.types';
import type { ProposalTrackProps, TrackAct, TrackRowKind } from './ProposalTrack.types';

/** The acts a standing offers: the one next act, and a second where the design draws one. */
export interface TrackActs {
  readonly main: TrackAct | null;
  readonly second: TrackAct | null;
}

/**
 * The one next act for each standing (`T-M06-018`): Share, Share again, Call, Make version 2,
 * Confirm won, Open the project. A reader who may not share is offered no share; a proposal that
 * was replaced or withdrawn offers nothing. While sharing is refused (`shareBlockedBy`, `F8-17`)
 * no share is offered: a reader who may edit is offered the new version that corrects it instead.
 * A newer version generated while the link serves an older one is offered to share first (`M06-45`).
 */
export function trackActsOf(
  detail: Pick<ProposalDetail, 'standing' | 'rights' | 'shareBlockedBy' | 'versions'>,
): TrackActs {
  const blocked = detail.shareBlockedBy !== null;
  const correct: TrackAct | null = blocked && detail.rights.edit ? 'new_version' : null;
  const share = (act: TrackAct): TrackAct | null =>
    blocked ? correct : detail.rights.share ? act : null;
  const none: TrackActs = { main: null, second: null };
  if (versionAwaitingShare(detail.standing, detail.versions) !== null) {
    return { main: share('share_ready'), second: null };
  }
  switch (detail.standing) {
    case 'draft':
      return detail.rights.edit ? { main: 'continue', second: null } : none;
    case 'ready':
      return { main: share('share'), second: null };
    case 'shared':
      return { main: share('share_again'), second: null };
    case 'opened':
    case 'declined':
      return { main: 'call', second: share('share_again') };
    case 'negotiating':
      return detail.rights.edit ? { main: 'new_version', second: null } : none;
    case 'accepted':
      return { main: 'confirm_won', second: null };
    case 'won':
      return { main: 'open_project', second: null };
    default:
      return none;
  }
}

export const TRACK_ACT_GLYPH: Record<TrackAct, ShellGlyphName> = {
  continue: 'pencil',
  share: 'send',
  share_again: 'send',
  share_ready: 'send',
  call: 'phone',
  new_version: 'pencil',
  confirm_won: 'check',
  open_project: 'arrow-right',
};

/**
 * How far along Generated → Shared → Opened → Answered the proposal is: the step it stands on, or
 * -1 for a draft never generated — no step has happened, so none is ticked.
 */
export function trackReached(tracking: ProposalTracking): number {
  if (tracking.answer !== null) return 3;
  if (tracking.firstOpenedAt !== null) return 2;
  if (tracking.sharedAt !== null) return 1;
  return tracking.generatedAt === null ? -1 : 0;
}

export type TrackNodeState = 'done' | 'now' | 'ahead';

export function trackNodeState(index: number, reached: number): TrackNodeState {
  if (index < reached) return 'done';
  return index === reached ? 'now' : 'ahead';
}

export interface TrackRow {
  readonly kind: TrackRowKind;
  readonly glyph: ShellGlyphName;
  readonly hue: HueTileProps['hue'];
}

/**
 * The rows under the hero, in order: the open task first, the thank-you on an accepted proposal,
 * the installation message when it is due, then the version, the links and the document.
 */
export function trackRowsOf(
  detail: Pick<ProposalDetail, 'standing' | 'followUp'>,
  crewMessageDue: boolean,
): readonly TrackRow[] {
  const urgent = detail.standing === 'accepted' || detail.standing === 'declined';
  return [
    { kind: 'follow_up', glyph: 'flag', hue: urgent ? 'warning' : 'ocean' },
    ...(detail.standing === 'accepted'
      ? [{ kind: 'thank', glyph: 'chat', hue: 'ocean' } as const]
      : []),
    ...(crewMessageDue ? [{ kind: 'crew', glyph: 'truck', hue: 'warning' } as const] : []),
    { kind: 'version', glyph: 'layers', hue: 'ocean' },
    { kind: 'links', glyph: 'link', hue: 'ocean' },
    { kind: 'document', glyph: 'document', hue: 'ocean' },
  ];
}

/** The rows under the hero as both halves draw them: each with its words and where it opens. */
export function trackRowViewsOf(props: ProposalTrackProps, detail: ProposalDetail) {
  const open: Record<TrackRowKind, (() => void) | undefined> = {
    follow_up: detail.followUp === null ? undefined : props.onOpenFollowUp,
    thank: props.onThank,
    crew: props.onCrewMessage,
    version: props.onOpenVersions,
    links: props.onOpenLinks,
    document: props.onOpenDocument,
  };
  const { shown } = props;
  const sheets =
    shown === null ? null : proposalSheetsOf(shown.snapshot.pages, shown.snapshot.fields).length;
  return trackRowsOf(detail, props.crewMessageDue).map((row) => {
    const text = props.words.row(row.kind, detail, sheets);
    return {
      key: row.kind,
      row: {
        glyph: row.glyph,
        hue: row.hue,
        title: text.title,
        line: text.line,
        onOpen: open[row.kind],
      },
    };
  });
}

/** The bars a waiting track draws: the hero, then its rows. */
export const TRACK_WAIT_BARS = ['panel', 'row', 'row', 'row', 'row'] as const;

/** How wide the hero's cover is drawn at each room, as the approved design draws it. */
export const TRACK_COVER_WIDTH = { wide: 190, narrow: 112 } as const;
