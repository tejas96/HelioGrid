/* The turns themselves (web), oldest first — and the in-flow language-switch marker, so a reader
   scrolling the conversation meets the change where it happened rather than only in the header. */

import { Fragment } from 'react';
import { turnEntriesOf } from './Transcript.logic';
import type { TranscriptTurnListProps } from './Transcript.types';
import { GlobeGlyph } from './TranscriptChrome';
import { TranscriptTurnRow } from './TranscriptTurnRow';

export function TranscriptTurnList({
  turns,
  marks,
  currentAt,
  agentName,
  customerName,
  onSeek,
  density,
  words,
}: TranscriptTurnListProps) {
  return (
    <ol className="hg-transcript-turns" data-density={density}>
      {turnEntriesOf(turns, marks, currentAt, words).map(({ key, turn, current, switchLine }) => (
        <Fragment key={key}>
          {switchLine === null ? null : (
            <li className="hg-transcript-switch">
              <span className="hg-transcript-globe">
                <GlobeGlyph size={13} />
              </span>
              <span>{switchLine}</span>
            </li>
          )}
          <TranscriptTurnRow
            turn={turn}
            current={current}
            agentName={agentName}
            customerName={customerName}
            onSeek={onSeek}
            density={density}
            words={words}
          />
        </Fragment>
      ))}
    </ol>
  );
}
