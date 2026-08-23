import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { StatusMark } from '../../primitives/StatusMark';
import type { FindingListProps, FindingStatus, FindingStatusMeta } from './FindingList.types';
import {
  arrangeFindings,
  countSentence,
  FINDING_LABEL,
  FINDING_RANK,
  FINDING_VERDICT_LABEL,
  findingVerdict,
  headingWords,
  normaliseFindings,
  readyToggleWords,
} from './FindingList.verdict';
import { FINDING_TONE, FindingListRow } from './FindingListRow';

interface WebFindingListProps extends FindingListProps {
  className?: string;
  style?: CSSProperties;
}

/* The status table in the web colour vocabulary. Exposed as `FindingList.statuses` so a caller
   can read the same ranks, words and tokens the list draws with. */
const FINDING_STATUSES: Record<FindingStatus, FindingStatusMeta> = {
  blocking: {
    rank: FINDING_RANK.blocking,
    label: FINDING_LABEL.blocking,
    tone: 'var(--danger-text)',
    bg: 'var(--danger-bg)',
    mark: 'var(--danger)',
    verdict: FINDING_VERDICT_LABEL.blocking,
  },
  attention: {
    rank: FINDING_RANK.attention,
    label: FINDING_LABEL.attention,
    tone: 'var(--warning-text)',
    bg: 'var(--warning-bg)',
    /* The warning MARK takes --warning-text: plain --warning clears no contrast floor. */
    mark: 'var(--warning-text)',
    verdict: FINDING_VERDICT_LABEL.attention,
  },
  ready: {
    rank: FINDING_RANK.ready,
    label: FINDING_LABEL.ready,
    tone: 'var(--success-text)',
    bg: 'var(--success-bg)',
    mark: 'var(--success)',
    verdict: FINDING_VERDICT_LABEL.ready,
  },
};

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

/** The gate that lists every failure, counted, each with the act that fixes it. */
export function FindingList(props: WebFindingListProps) {
  const {
    findings,
    actionLabel = 'share',
    title,
    order = 'severity',
    readyMode = 'collapsed',
    verdict = true,
    onJump,
    jumpLabel = 'Go to the step',
    passTitle = 'Nothing to fix',
    passMessage,
    note,
    density = 'expressive',
    className,
    style,
  } = props;
  useRefusedProps(props);

  const list = normaliseFindings(findings);
  const summary = findingVerdict(list);
  const [readyOpen, setReadyOpen] = useState(readyMode === 'listed');
  const { ready, mainList, tailList, showReady } = arrangeFindings(
    list,
    order,
    readyMode,
    readyOpen,
  );
  const heading = title ?? headingWords(summary, actionLabel, passTitle);

  return (
    <section
      className={classNames('hg-finding-list', className)}
      data-density={density}
      aria-label={typeof heading === 'string' ? heading : undefined}
      style={style}
    >
      <div className="hg-finding-list-head">
        <h3 className="hg-finding-list-heading">{heading}</h3>
        {verdict ? (
          <StatusMark
            tone={FINDING_TONE[summary.status]}
            label={FINDING_LABEL[summary.status]}
            className="hg-finding-list-verdict"
          />
        ) : null}
      </div>

      <p role="status" className="hg-finding-list-count">
        {countSentence(summary, passMessage)}
      </p>

      {mainList.length > 0 ? (
        <ul className="hg-finding-list-items">
          {mainList.map((entry) => (
            <FindingListRow
              key={entry.key}
              finding={entry.finding}
              onJump={onJump}
              jumpLabel={jumpLabel}
            />
          ))}
        </ul>
      ) : null}

      {/* The fold's expanded state goes through the primitive — `aria-expanded` here,
          `accessibilityState.expanded` on the native half, one declaration — and the 44px floor
          and the focus ring come with it. */}
      {ready.length > 0 && readyMode === 'collapsed' ? (
        <Pressable
          className="hg-finding-list-ready-toggle"
          accessibilityState={{ expanded: readyOpen }}
          onPress={() => setReadyOpen((open) => !open)}
        >
          {readyToggleWords(ready.length, readyOpen)}
        </Pressable>
      ) : null}
      {tailList.length > 0 && showReady ? (
        <ul className="hg-finding-list-items">
          {tailList.map((entry) => (
            <FindingListRow
              key={entry.key}
              finding={entry.finding}
              onJump={onJump}
              jumpLabel={jumpLabel}
            />
          ))}
        </ul>
      ) : null}

      {note === undefined ? null : <p className="hg-finding-list-note">{note}</p>}
    </section>
  );
}

/** The same function a Generate button reads, so button and list can never disagree. */
FindingList.verdict = findingVerdict;
FindingList.statuses = FINDING_STATUSES;
