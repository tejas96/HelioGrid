import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { Finding, FindingListProps, FindingVerdict } from './FindingList.types';
import {
  arrangeFindings,
  findingVerdict,
  headingWords,
  type KeyedFinding,
  normaliseFindings,
} from './FindingList.verdict';

/** The two props this component refuses to have. Ignored loudly rather than silently. */
function useRefusedProps(props: FindingListProps) {
  const guarded = props as unknown as Record<string, unknown>;
  const refused = 'max' in guarded || 'mode' in guarded;
  useEffect(() => {
    if (refused) {
      console.warn(
        'FindingList: `max` and `mode` are not props. A gate that promises every failure cannot cap or rank one away — use BannerStack for facts that can speak for one another.',
      );
    }
  }, [refused]);
}

/** The list as both halves draw it: the verdict, the heading, the lists and the ready fold. */
export interface FindingListView {
  summary: FindingVerdict;
  heading: ReactNode;
  mainList: KeyedFinding[];
  tailList: KeyedFinding[];
  ready: Finding[];
  readyOpen: boolean;
  toggleReady: () => void;
  /** Only a `collapsed` list with ready findings offers the fold. */
  foldsReady: boolean;
  /** The ready tail shows when it has findings and the fold is open or never folded. */
  showsTail: boolean;
}

/** Holds the ready fold's open state, which starts open only for a `listed` list. */
export function useFindingList(props: FindingListProps): FindingListView {
  useRefusedProps(props);
  const {
    findings,
    words,
    actionLabel,
    title,
    order = 'severity',
    readyMode = 'collapsed',
    passTitle,
  } = props;
  const list = normaliseFindings(findings);
  const summary = findingVerdict(list, words);
  const [readyOpen, setReadyOpen] = useState(readyMode === 'listed');
  const { ready, mainList, tailList, showReady } = arrangeFindings(
    list,
    order,
    readyMode,
    readyOpen,
  );
  return {
    summary,
    heading: title ?? headingWords(summary, words, actionLabel, passTitle),
    mainList,
    tailList,
    ready,
    readyOpen,
    toggleReady: () => setReadyOpen((open) => !open),
    foldsReady: ready.length > 0 && readyMode === 'collapsed',
    showsTail: tailList.length > 0 && showReady,
  };
}
