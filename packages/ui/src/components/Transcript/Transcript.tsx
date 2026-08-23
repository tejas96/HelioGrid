/* Transcript (web) — WHAT THE AGENT AND THE CUSTOMER ACTUALLY SAID, turn by turn.

   IT IS THE ARTEFACT THAT OUTLIVES THE RECORDING (M07-38): past the pack's retention window this
   is the only record of what an unsupervised agent said to a customer, so it renders in full with
   no audio present.

   THE LANGUAGE LABEL IS PER TRANSCRIPT and never asserts one language falsely; a switch is ALSO
   marked in the flow at the turn where it happened. THE OFFSET IS A SEEK while the audio exists.
   VOLUME: a chronological window from the START — the opposite direction from ActivityStream's,
   because a conversation's first turn is the interesting one.

   This file holds the window and the language derivation, and hands the rest to the four parts
   that own it: `TranscriptHeader`, `TranscriptPlaceholder`, `TranscriptTurnList`, `TranscriptMore`. */

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { countLine, deriveSwitches, languageSentence, switchPoints } from './Transcript.language';
import type { TranscriptProps } from './Transcript.types';
import { TranscriptHeader } from './TranscriptHeader';
import { TranscriptMore } from './TranscriptMore';
import { TranscriptPlaceholder } from './TranscriptPlaceholder';
import { TranscriptTurnList } from './TranscriptTurnList';

interface WebTranscriptProps extends TranscriptProps {
  className?: string;
  style?: CSSProperties;
}

export function Transcript({
  turns = [],
  language,
  switches,
  agentName,
  customerName,
  title = 'Transcript',
  meta,
  retainedNote,
  currentAt,
  onSeek,
  visibleCount = 40,
  step = 40,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  total,
  state = 'ready',
  emptyTitle = 'No transcript for this call',
  emptyDescription = "The call connected but nothing was transcribed. The recording and the rep's notes are on this record.",
  errorMessage = "Couldn't load the transcript. Nothing has been lost — try again.",
  onRetry,
  unavailableTitle = 'No transcript on this call',
  unavailableMessage = 'This call was not transcribed. The recording is the only record of it.',
  density = 'expressive',
  className,
  style,
}: WebTranscriptProps) {
  const [shown, setShown] = useState(visibleCount);
  useEffect(() => setShown(visibleCount), [visibleCount]);

  const derived = useMemo(
    () => switches ?? deriveSwitches(turns, language),
    [switches, turns, language],
  );
  const marks = useMemo(() => switchPoints(turns, language), [turns, language]);

  const sentence = languageSentence(language, derived);
  const whole = total ?? turns.length;
  const visible = turns.slice(0, shown);
  const remaining = Math.max(0, turns.length - shown);
  const more = remaining > 0 || hasMore;
  /* The count line states the whole call — and only once there is a call to count. */
  const count =
    state === 'ready' && turns.length > 0 ? countLine(whole, agentName, customerName) : null;
  const blocked =
    state === 'loading' || state === 'error' || state === 'unavailable' || turns.length === 0;

  const shell = (children: ReactNode) => (
    <section
      aria-label={sentence ? `${title} · ${sentence}` : title}
      className={classNames('hg-transcript', className)}
      style={style}
    >
      <TranscriptHeader
        title={title}
        meta={meta}
        sentence={sentence}
        retainedNote={retainedNote}
        count={count}
      />
      {children}
    </section>
  );

  if (blocked) {
    return shell(
      <TranscriptPlaceholder
        state={state}
        turnCount={turns.length}
        density={density}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        errorMessage={errorMessage}
        onRetry={onRetry}
        unavailableTitle={unavailableTitle}
        unavailableMessage={unavailableMessage}
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
      />
      {more ? (
        <TranscriptMore
          remaining={remaining}
          loadingMore={loadingMore}
          onReveal={() => setShown((n) => n + step)}
          onLoadMore={onLoadMore}
        />
      ) : null}
    </>,
  );
}
