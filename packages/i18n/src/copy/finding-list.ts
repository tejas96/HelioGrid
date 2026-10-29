/**
 * The `FindingList` gate's own words (`packages/ui`'s `FindingListWords`): each status's word, the
 * worst-of verdict, the counted heading and line, the ready fold and the jump — authored once for
 * every gate that lists what must be fixed (`M06-23`, `M05-58`).
 */
import type { Translator } from '../runtime';

const FINDING_LIST = {
  blocking: /*i18n*/ { id: 'Blocking' },
  attention: /*i18n*/ { id: 'Needs attention' },
  ready: /*i18n*/ { id: 'Ready' },
  blockingVerdict: /*i18n*/ { id: 'Blocking — this cannot be shared yet' },
  heading: /*i18n*/ {
    id: '{count, plural, one {Fix # issue to {action}} other {Fix # issues to {action}}}',
  },
  headingShare: /*i18n*/ {
    id: '{count, plural, one {Fix # issue to share} other {Fix # issues to share}}',
  },
  passTitle: /*i18n*/ { id: 'Nothing to fix' },
  noChecks: /*i18n*/ { id: 'No checks ran.' },
  allReady: /*i18n*/ {
    id: '{total, plural, one {# check is ready.} other {All # checks are ready.}}',
  },
  openCount: /*i18n*/ {
    id: '{open} of {total} checks need work — {blocking} blocking, {attention} to look at. {ready} ready.',
  },
  showReady: /*i18n*/ {
    id: '{count, plural, one {Show the # ready check} other {Show the # ready checks}}',
  },
  hideReady: /*i18n*/ {
    id: '{count, plural, one {Hide the # ready check} other {Hide the # ready checks}}',
  },
  jump: /*i18n*/ { id: 'Go to the step' },
  fixIn: /*i18n*/ { id: 'Fix in {step}' },
} as const;

/** The counts a gate's line names — `findingVerdict`'s, so the line cannot disagree with the list. */
interface FindingCounts {
  readonly openCount: number;
  readonly total: number;
  readonly blockingCount: number;
  readonly attentionCount: number;
  readonly readyCount: number;
}

/** Every word `FindingList` composes, in the reader's language. */
export function findingListWords(t: Translator['t']) {
  const status = {
    blocking: t(FINDING_LIST.blocking),
    attention: t(FINDING_LIST.attention),
    ready: t(FINDING_LIST.ready),
  };
  return {
    status,
    verdict: { ...status, blocking: t(FINDING_LIST.blockingVerdict) },
    heading: (count: number, action?: string) =>
      action === undefined
        ? t(FINDING_LIST.headingShare, { count })
        : t(FINDING_LIST.heading, { count, action }),
    passTitle: t(FINDING_LIST.passTitle),
    noChecks: t(FINDING_LIST.noChecks),
    allReady: (total: number) => t(FINDING_LIST.allReady, { total }),
    openCount: (counts: FindingCounts) =>
      t(FINDING_LIST.openCount, {
        open: counts.openCount,
        total: counts.total,
        blocking: counts.blockingCount,
        attention: counts.attentionCount,
        ready: counts.readyCount,
      }),
    readyToggle: (count: number, open: boolean) =>
      t(open ? FINDING_LIST.hideReady : FINDING_LIST.showReady, { count }),
    jump: t(FINDING_LIST.jump),
    fixIn: (step: string) => t(FINDING_LIST.fixIn, { step }),
  };
}
