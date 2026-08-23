/* Transcript (native) — the same document, oldest first, two fixed participants, one language label
   per transcript, and offsets that seek while the recording is playable.

   This file holds the window and the language derivation, and hands the rest to the four parts that
   own it: `TranscriptHeader`, `TranscriptPlaceholder`, `TranscriptTurnList`, `TranscriptMore` —
   the same decomposition as the web half. */

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { countLine, deriveSwitches, languageSentence, switchPoints } from './Transcript.language';
import type { TranscriptProps } from './Transcript.types';
import { TranscriptHeader } from './TranscriptHeader.native';
import { TranscriptMore } from './TranscriptMore.native';
import { TranscriptPlaceholder } from './TranscriptPlaceholder.native';
import { TranscriptTurnList } from './TranscriptTurnList.native';

interface NativeTranscriptProps extends TranscriptProps {
  style?: StyleProp<ViewStyle>;
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
  style,
}: NativeTranscriptProps) {
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
    /* THE NAME IS ALREADY SPOKEN, SO IT IS NOT SAID TWICE. The web half's `<section aria-label>`
       names a landmark; RN has no landmark, and this label's two halves are both rendered right
       inside it — `TranscriptHeader` prints `title` as the overline and `sentence` as the language
       line. Hung on a bare View the words announced nothing; announced they would repeat the two
       lines a reader is about to hear, and `accessible` would fold every turn, every seek target
       and "Show the rest of the call" into one element. So the dead label goes. */
    <View style={[{ minWidth: 0 }, style]}>
      <TranscriptHeader
        title={title}
        meta={meta}
        sentence={sentence}
        retainedNote={retainedNote}
        count={count}
      />
      {children}
    </View>
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
