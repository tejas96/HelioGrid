/* Transcript (web) — WHAT THE AGENT AND THE CUSTOMER ACTUALLY SAID, turn by turn.

   IT IS THE ARTEFACT THAT OUTLIVES THE RECORDING (M07-38): past the pack's retention window this
   is the only record of what an unsupervised agent said to a customer, so it renders in full with
   no audio present.

   THE LANGUAGE LABEL IS PER TRANSCRIPT and never asserts one language falsely; a switch is ALSO
   marked in the flow at the turn where it happened. THE OFFSET IS A SEEK while the audio exists.
   VOLUME: a chronological window from the START — the opposite direction from ActivityStream's,
   because a conversation's first turn is the interesting one.

   The window and the language derivation are `useTranscriptWindow`'s, shared with the phone; this
   file hands the rest to the four parts that own it: `TranscriptHeader`, `TranscriptPlaceholder`,
   `TranscriptTurnList`, `TranscriptMore`. */

import type { CSSProperties, ReactNode } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import type { TranscriptProps } from './Transcript.types';
import { TranscriptHeader } from './TranscriptHeader';
import { TranscriptMore } from './TranscriptMore';
import { TranscriptPlaceholder } from './TranscriptPlaceholder';
import { TranscriptTurnList } from './TranscriptTurnList';
import { useTranscriptWindow } from './use-transcript-window';

interface WebTranscriptProps extends TranscriptProps {
  className?: string;
  style?: CSSProperties;
}

export function Transcript(props: WebTranscriptProps) {
  const {
    agentName,
    customerName,
    title,
    meta,
    retainedNote,
    currentAt,
    onSeek,
    onLoadMore,
    loadingMore = false,
    emptyTitle,
    emptyDescription,
    errorMessage,
    retryLabel,
    unavailableTitle,
    unavailableMessage,
    density = 'expressive',
    words,
    className,
    style,
  } = props;
  /* The transcript's own frame stays while a failed read reloads, so *Try again* hands focus to it. */
  const frame = useRef<HTMLElement>(null);
  const {
    state,
    onRetry,
    sentence,
    count,
    blocked,
    turnCount,
    visible,
    marks,
    remaining,
    more,
    reveal,
  } = useTranscriptWindow(props);

  const shell = (children: ReactNode) => (
    <section
      ref={frame}
      tabIndex={-1}
      aria-label={sentence ? `${title} · ${sentence}` : title}
      className={classNames('hg-transcript', 'hg-focus-target', className)}
      style={style}
    >
      <TranscriptHeader
        title={title}
        meta={meta}
        sentence={sentence}
        retainedNote={retainedNote}
        count={count}
        notRecorded={words.languageNotRecorded}
      />
      {children}
    </section>
  );

  if (blocked) {
    return shell(
      <TranscriptPlaceholder
        state={state}
        turnCount={turnCount}
        density={density}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        errorMessage={errorMessage}
        onRetry={onRetry}
        retryLabel={retryLabel}
        unavailableTitle={unavailableTitle}
        unavailableMessage={unavailableMessage}
        loadingLabel={words.loading}
        focusAfter={frame}
      />,
    );
  }

  return shell(
    <>
      <TranscriptTurnList
        turns={visible}
        marks={marks}
        currentAt={currentAt}
        agentName={agentName}
        customerName={customerName}
        onSeek={onSeek}
        density={density}
        words={words}
      />
      {more ? (
        <TranscriptMore
          remaining={remaining}
          loadingMore={loadingMore}
          onReveal={reveal}
          onLoadMore={onLoadMore}
          words={words}
        />
      ) : null}
    </>,
  );
}
