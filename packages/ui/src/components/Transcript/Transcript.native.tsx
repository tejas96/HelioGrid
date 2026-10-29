/* Transcript (native) — the same document, oldest first, two fixed participants, one language label
   per transcript, and offsets that seek while the recording is playable.

   The window and the language derivation are `useTranscriptWindow`'s, shared with the web; this
   file hands the rest to the four parts that own it: `TranscriptHeader`, `TranscriptPlaceholder`,
   `TranscriptTurnList`, `TranscriptMore` — the same decomposition as the web half. */

import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import type { TranscriptProps } from './Transcript.types';
import { TranscriptHeader } from './TranscriptHeader.native';
import { TranscriptMore } from './TranscriptMore.native';
import { TranscriptPlaceholder } from './TranscriptPlaceholder.native';
import { TranscriptTurnList } from './TranscriptTurnList.native';
import { useTranscriptWindow } from './use-transcript-window';

interface NativeTranscriptProps extends TranscriptProps {
  style?: StyleProp<ViewStyle>;
}

export function Transcript(props: NativeTranscriptProps) {
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
    style,
  } = props;
  /* The transcript's own frame stays while a failed read reloads, so *Try again* hands the reader
     to it. */
  const frame = useRef<View>(null);
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
    /* THE NAME IS ALREADY SPOKEN, SO IT IS NOT SAID TWICE. The web half's `<section aria-label>`
       names a landmark; RN has no landmark, and this label's two halves are both rendered right
       inside it — `TranscriptHeader` prints `title` as the overline and `sentence` as the language
       line. Hung on a bare View the words announced nothing; announced they would repeat the two
       lines a reader is about to hear, and `accessible` would fold every turn, every seek target
       and "Show the rest of the call" into one element. So the dead label goes. */
    <View ref={frame} style={[{ minWidth: 0 }, style]}>
      <TranscriptHeader
        title={title}
        meta={meta}
        sentence={sentence}
        retainedNote={retainedNote}
        count={count}
        notRecorded={words.languageNotRecorded}
      />
      {children}
    </View>
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
