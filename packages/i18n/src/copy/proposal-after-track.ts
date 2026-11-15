import type { ProposalDetail, ProposalTracking, TranslatedText } from '@heliogrid/contracts';
import { customerShortNameOf, versionAwaitingShare, versionsOnLink } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { proposalStandingWord } from './proposal-after-standing';
import {
  type ProposalTrackFormats,
  THE_CUSTOMER,
  type TrackActKind,
  type TrackLine,
  type TrackRowKind,
  trackActWord,
  trackNodeWords,
  trackRowWords,
  WHOLE_MINUTE,
} from './proposal-after-track-rows';

type T = Translator['t'];

const TRACK = {
  heroName: /*i18n*/ { id: 'Proposal status' },
  openDocument: /*i18n*/ { id: 'Open the document' },
  trackName: /*i18n*/ { id: 'What happened' },
  neverDelivered: /*i18n*/ {
    id: 'HelioGrid shows when the link is opened. It never claims that a message was delivered.',
  },
  blockedTitle: /*i18n*/ { id: 'This proposal cannot be shared yet' },
  blockedStale: /*i18n*/ { id: 'Something it was priced on has changed since it was made.' },
  blockedRecomputing: /*i18n*/ { id: 'Its figures are being worked out again.' },
  blockedUnchecked: /*i18n*/ {
    id: 'Its figures could not be checked against today’s prices and rules.',
  },
  blockedOther: /*i18n*/ { id: 'Its figures are not current.' },
  loading: /*i18n*/ { id: 'Loading the proposal' },
  failedTitle: /*i18n*/ { id: 'This proposal did not load' },
  failedMessage: /*i18n*/ { id: 'It is safe. Check the connection and try again.' },
  retry: /*i18n*/ { id: 'Try again' },
  minutes: /*i18n*/ { id: '{count, plural, one {# minute} other {# minutes}}' },
} as const;

const STORY = {
  draftTitle: /*i18n*/ { id: 'A draft for {name}' },
  draftLine: /*i18n*/ { id: '{done} of {of} steps are done. Continue where you stopped.' },
  readyTitle: /*i18n*/ { id: 'Ready for {name}' },
  readyLine: /*i18n*/ { id: 'Share it on WhatsApp. It takes one tap.' },
  sharedTitle: /*i18n*/ { id: 'Shared {when}' },
  sharedLine: /*i18n*/ { id: '{name} has not opened it yet. You will know when they do.' },
  readTitle: /*i18n*/ { id: '{name} read it for {duration}' },
  openedTitle: /*i18n*/ { id: '{name} opened it' },
  openedLine: /*i18n*/ { id: 'Opened {when}.' },
  openedOnLine: /*i18n*/ { id: 'Opened {when} on a {device}.' },
  longest: /*i18n*/ { id: 'They looked longest at {section}.' },
  changeTitle: /*i18n*/ { id: '{name} wants a change' },
  changeLine: /*i18n*/ { id: '“{words}” Asked {when}.' },
  changeLinePlain: /*i18n*/ { id: 'Asked {when}. Make a new version and share it.' },
  acceptedTitle: /*i18n*/ { id: '{name} accepted' },
  acceptedLine: /*i18n*/ {
    id: '{when}, from the link named {label}. Call them, then confirm the win.',
  },
  acceptedLinePlain: /*i18n*/ { id: '{when}. Call them, then confirm the win.' },
  declinedTitle: /*i18n*/ { id: '{name} declined' },
  declinedLine: /*i18n*/ { id: '“{words}” Call them, then mark lost or share again.' },
  declinedLinePlain: /*i18n*/ { id: 'Call them, then mark lost or share again.' },
  wonTitle: /*i18n*/ { id: 'Won · project {number}' },
  wonTitlePlain: /*i18n*/ { id: 'Won' },
  wonLine: /*i18n*/ {
    id: 'The price and the payment plan came from this proposal. Nobody typed them again.',
  },
  replacedTitle: /*i18n*/ { id: 'Replaced by a newer proposal' },
  replacedLine: /*i18n*/ { id: 'This one is kept exactly as it was sent.' },
  withdrawnTitle: /*i18n*/ { id: 'Withdrawn' },
  withdrawnLine: /*i18n*/ { id: 'Its link says the proposal is no longer active.' },
  awaitingTitle: /*i18n*/ { id: 'Version {version} is ready' },
  awaitingLine: /*i18n*/ { id: '{name} still sees version {shown} until you share it.' },
} as const;

const DEVICE: Readonly<Record<string, MessageRef | undefined>> = {
  phone: /*i18n*/ { id: 'phone' },
  tablet: /*i18n*/ { id: 'tablet' },
  desktop: /*i18n*/ { id: 'computer' },
};

const SECTION: Readonly<Record<string, MessageRef | undefined>> = {
  price: /*i18n*/ { id: 'the price' },
  savings: /*i18n*/ { id: 'the savings' },
  generation: /*i18n*/ { id: 'the generation' },
  parts: /*i18n*/ { id: 'the parts' },
  payment: /*i18n*/ { id: 'the payment plan' },
  timeline: /*i18n*/ { id: 'the timeline' },
  terms: /*i18n*/ { id: 'the terms' },
};

function storyOf(t: T, formats: ProposalTrackFormats, detail: ProposalDetail): TrackLine {
  const { tracking } = detail;
  const { clientName, segment } = detail.document.deal;
  const name = customerShortNameOf(clientName, segment) ?? t(THE_CUSTOMER);
  const at = (instant: string | null) => (instant === null ? '' : formats.when(instant));
  const ago = (instant: string | null) => (instant === null ? '' : formats.ago(instant));
  const awaiting = versionAwaitingShare(detail.standing, detail.versions);
  if (awaiting !== null) {
    const shown = versionsOnLink(detail.versions).shown ?? awaiting - 1;
    return {
      title: t(STORY.awaitingTitle, { version: awaiting }),
      line: t(STORY.awaitingLine, { name, shown }),
    };
  }
  switch (detail.standing) {
    case 'draft':
      return {
        title: t(STORY.draftTitle, { name }),
        line: t(STORY.draftLine, { done: detail.progress.complete, of: detail.progress.of }),
      };
    case 'ready':
      return { title: t(STORY.readyTitle, { name }), line: t(STORY.readyLine) };
    case 'shared':
      return {
        title: t(STORY.sharedTitle, { when: ago(tracking.sharedAt) }),
        line: t(STORY.sharedLine, { name }),
      };
    case 'opened':
      return openedStory(t, formats, tracking, name);
    case 'negotiating':
      return {
        title: t(STORY.changeTitle, { name }),
        line:
          tracking.answerWords === null
            ? t(STORY.changeLinePlain, { when: ago(tracking.answeredAt) })
            : t(STORY.changeLine, { words: tracking.answerWords, when: ago(tracking.answeredAt) }),
      };
    case 'accepted':
      return {
        title: t(STORY.acceptedTitle, { name }),
        line:
          tracking.answeredVia === null
            ? t(STORY.acceptedLinePlain, { when: at(tracking.answeredAt) })
            : t(STORY.acceptedLine, {
                when: at(tracking.answeredAt),
                label: tracking.answeredVia.label,
              }),
      };
    case 'declined':
      return {
        title: t(STORY.declinedTitle, { name }),
        line:
          tracking.answerWords === null
            ? t(STORY.declinedLinePlain)
            : t(STORY.declinedLine, { words: tracking.answerWords }),
      };
    case 'won':
      return {
        title:
          detail.project === null
            ? t(STORY.wonTitlePlain)
            : t(STORY.wonTitle, { number: detail.project.number }),
        line: t(STORY.wonLine),
      };
    case 'withdrawn':
      return { title: t(STORY.withdrawnTitle), line: t(STORY.withdrawnLine) };
    case 'replaced':
      return { title: t(STORY.replacedTitle), line: t(STORY.replacedLine) };
    default:
      /* A standing a newer server learned: its word as sent, and nothing claimed about it. */
      return { title: proposalStandingWord(t, detail.standing), line: shownAsSent('') };
  }
}

function openedStory(
  t: T,
  formats: ProposalTrackFormats,
  tracking: ProposalTracking,
  name: string,
): TrackLine {
  const seconds = tracking.viewedSeconds ?? 0;
  const title =
    seconds < WHOLE_MINUTE
      ? t(STORY.openedTitle, { name })
      : t(STORY.readTitle, {
          name,
          duration: t(TRACK.minutes, { count: Math.round(seconds / WHOLE_MINUTE) }),
        });
  const when = tracking.lastOpenedAt === null ? '' : formats.ago(tracking.lastOpenedAt);
  const device = tracking.deviceClass === null ? undefined : DEVICE[tracking.deviceClass];
  const opened =
    device === undefined
      ? t(STORY.openedLine, { when })
      : t(STORY.openedOnLine, { when, device: t(device) });
  const section = tracking.longestSection === null ? undefined : SECTION[tracking.longestSection];
  return {
    title,
    line:
      section === undefined
        ? opened
        : shownAsSent(`${opened} ${t(STORY.longest, { section: t(section) })}`),
  };
}

/** Why sharing is refused, from the server's reason (`F8-17`); a reason a newer server learned reads as not current. */
function blockedLineOf(t: T, kind: string): TranslatedText {
  switch (kind) {
    case 'stale':
      return t(TRACK.blockedStale);
    case 'recomputing':
      return t(TRACK.blockedRecomputing);
    case 'unchecked':
      return t(TRACK.blockedUnchecked);
    default:
      return t(TRACK.blockedOther);
  }
}

/** `ProposalTrack`'s words (`SCR-M06-18`): each sentence chosen by where the proposal stands. */
export function proposalTrackWords(t: T, formats: ProposalTrackFormats) {
  return {
    heroName: t(TRACK.heroName),
    standing: (standing: string) => proposalStandingWord(t, standing),
    story: (detail: ProposalDetail) => storyOf(t, formats, detail),
    act: (act: TrackActKind, detail: ProposalDetail) => trackActWord(t, act, detail),
    openDocument: t(TRACK.openDocument),
    trackName: t(TRACK.trackName),
    nodes: (tracking: ProposalTracking) => trackNodeWords(t, formats, tracking),
    neverDelivered: t(TRACK.neverDelivered),
    row: (kind: TrackRowKind, detail: ProposalDetail, sheets: number | null) =>
      trackRowWords(t, formats, kind, detail, sheets),
    blockedTitle: t(TRACK.blockedTitle),
    blockedLine: (kind: string) => blockedLineOf(t, kind),
    loading: t(TRACK.loading),
    failedTitle: t(TRACK.failedTitle),
    failedMessage: t(TRACK.failedMessage),
    retry: t(TRACK.retry),
  };
}
