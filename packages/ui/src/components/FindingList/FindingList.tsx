import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { StatusMark } from '../../primitives/StatusMark';
import type { FindingListProps, FindingStatus, FindingStatusMeta } from './FindingList.types';
import { countSentence, FINDING_RANK, findingVerdict } from './FindingList.verdict';
import { FINDING_TONE, FindingListRow } from './FindingListRow';
import { useFindingList } from './use-finding-list';

interface WebFindingListProps extends FindingListProps {
  className?: string;
  style?: CSSProperties;
}

/* The status table in the web colour vocabulary. Exposed as `FindingList.statuses` so a caller
   can read the same ranks and tokens the list draws with; the words are the caller's. */
const FINDING_STATUSES: Record<FindingStatus, FindingStatusMeta> = {
  blocking: {
    rank: FINDING_RANK.blocking,
    tone: 'var(--danger-text)',
    bg: 'var(--danger-bg)',
    mark: 'var(--danger)',
  },
  attention: {
    rank: FINDING_RANK.attention,
    tone: 'var(--warning-text)',
    bg: 'var(--warning-bg)',
    /* The warning MARK takes --warning-text: plain --warning clears no contrast floor. */
    mark: 'var(--warning-text)',
  },
  ready: {
    rank: FINDING_RANK.ready,
    tone: 'var(--success-text)',
    bg: 'var(--success-bg)',
    mark: 'var(--success)',
  },
};

/** The gate that lists every failure, counted, each with the act that fixes it. */
export function FindingList(props: WebFindingListProps) {
  const {
    words,
    verdict = true,
    onJump,
    jumpLabel,
    passMessage,
    note,
    density = 'expressive',
    className,
    style,
  } = props;
  const {
    summary,
    heading,
    mainList,
    tailList,
    ready,
    readyOpen,
    toggleReady,
    foldsReady,
    showsTail,
  } = useFindingList(props);

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
            label={words.status[summary.status]}
            className="hg-finding-list-verdict"
          />
        ) : null}
      </div>

      <p role="status" className="hg-finding-list-count">
        {countSentence(summary, words, passMessage)}
      </p>

      {mainList.length > 0 ? (
        <ul className="hg-finding-list-items">
          {mainList.map((entry) => (
            <FindingListRow
              key={entry.key}
              finding={entry.finding}
              words={words}
              onJump={onJump}
              jumpLabel={jumpLabel}
            />
          ))}
        </ul>
      ) : null}

      {/* The fold's expanded state goes through the primitive — `aria-expanded` here,
          `accessibilityState.expanded` on the native half, one declaration — and the 44px floor
          and the focus ring come with it. */}
      {foldsReady ? (
        <Pressable
          className="hg-finding-list-ready-toggle"
          accessibilityState={{ expanded: readyOpen }}
          onPress={toggleReady}
        >
          {words.readyToggle(ready.length, readyOpen)}
        </Pressable>
      ) : null}
      {showsTail ? (
        <ul className="hg-finding-list-items">
          {tailList.map((entry) => (
            <FindingListRow
              key={entry.key}
              finding={entry.finding}
              words={words}
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
