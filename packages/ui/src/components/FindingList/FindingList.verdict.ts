import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { Finding, FindingListWords, FindingStatus, FindingVerdict } from './FindingList.types';

/** Blocking > attention > ready. The one ranking, so nothing has to decide it twice. */
export const FINDING_RANK: Record<FindingStatus, number> = {
  blocking: 3,
  attention: 2,
  ready: 1,
};

/** An unstated status is `attention`: a check nobody classified is not a check that passed. */
export function statusOf(finding: Finding): FindingStatus {
  return finding.status ?? 'attention';
}

function normalise(findings: Finding[] | undefined): Finding[] {
  return (findings ?? []).filter((finding): finding is Finding => Boolean(finding));
}

/**
 * Worst-of across the set — the ONE computation, exported so a Generate button, a sheet header and
 * the list itself read the same answer from the same function rather than three screens each
 * deciding what "mostly fine" means.
 */
export function findingVerdict(
  findings: Finding[],
  words: Pick<FindingListWords, 'verdict'>,
): FindingVerdict {
  const list = normalise(findings);
  const open = list.filter((finding) => statusOf(finding) !== 'ready');
  const worst = list.reduce<FindingStatus>((acc, finding) => {
    const status = statusOf(finding);
    return FINDING_RANK[status] > FINDING_RANK[acc] ? status : acc;
  }, 'ready');
  return {
    status: worst,
    label: words.verdict[worst],
    total: list.length,
    openCount: open.length,
    blockingCount: list.filter((finding) => statusOf(finding) === 'blocking').length,
    attentionCount: list.filter((finding) => statusOf(finding) === 'attention').length,
    readyCount: list.length - open.length,
    passes: open.length === 0,
  };
}

export { normalise as normaliseFindings };

/** A finding paired with a render key: its own `id` where it has one, its position otherwise. */
export interface KeyedFinding {
  key: string;
  finding: Finding;
}

export function keyedFindings(findings: Finding[], prefix = 'f'): KeyedFinding[] {
  return findings.map((finding, index) => ({
    key: String(finding.id ?? `${prefix}${index}`),
    finding,
  }));
}

export interface FindingArrangement {
  /** Every ready finding, in the resolved order. Counted in the header in EVERY mode. */
  ready: Finding[];
  /** The list the reader sees first — never folds, caps or hides anything that needs work. */
  mainList: KeyedFinding[];
  /** The ready tail, which only `severity` order has: `given` renders one list. */
  tailList: KeyedFinding[];
  showReady: boolean;
}

/**
 * `given` NEVER SPLITS. Severity order renders open-then-ready, which IS the ordering. But a set
 * handed over in the caller's order (MS11-07) interleaves ready items by definition, so splitting
 * it into two lists would reorder the very thing `given` promises to keep: 1 ready / 2 attention /
 * 3 blocking / 4 ready would render 2,3,1,4. In `given` the visible findings are ONE list in the
 * caller's order; folding ready items removes them in place and never moves the rest.
 */
export function arrangeFindings(
  list: Finding[],
  order: 'severity' | 'given',
  readyMode: 'collapsed' | 'listed' | 'counted',
  readyOpen: boolean,
): FindingArrangement {
  const ordered =
    order === 'severity'
      ? [...list].sort((a, b) => FINDING_RANK[statusOf(b)] - FINDING_RANK[statusOf(a)])
      : list;
  const ready = ordered.filter((finding) => statusOf(finding) === 'ready');
  const showReady = readyMode !== 'counted' && (readyOpen || readyMode === 'listed');
  const open = ordered.filter((finding) => statusOf(finding) !== 'ready');
  const main = order === 'given' ? (showReady ? ordered : open) : open;
  return {
    ready,
    mainList: keyedFindings(main),
    tailList: order === 'given' ? [] : keyedFindings(ready, 'r'),
    showReady,
  };
}

/** The composed heading. THE COUNT COMES FROM THE LIST even when `title` replaces the words. */
export function headingWords(
  summary: FindingVerdict,
  words: FindingListWords,
  actionLabel: string | undefined,
  passTitle: ReactNode,
): ReactNode {
  if (summary.passes) {
    return passTitle ?? words.passTitle;
  }
  return words.heading(summary.openCount, actionLabel);
}

/** The counted line. Every member of the set is in one of these numbers. */
export function countSentence(
  summary: FindingVerdict,
  words: FindingListWords,
  passMessage?: ReactNode,
): ReactNode {
  if (summary.total === 0) {
    return words.noChecks;
  }
  if (summary.passes) {
    return passMessage ?? words.allReady(summary.total);
  }
  return words.openCount(summary);
}

/** The jump's words: the finding's own, else its step's, else the list's. */
export function jumpWords(
  finding: Finding,
  words: FindingListWords,
  jumpLabel: TranslatedText | undefined,
): TranslatedText {
  if (finding.jumpLabel !== undefined) return finding.jumpLabel;
  if (finding.step !== undefined) return words.fixIn(finding.step);
  return jumpLabel ?? words.jump;
}
