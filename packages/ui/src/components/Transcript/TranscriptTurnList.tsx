/* The turns themselves (web), oldest first — and the in-flow language-switch marker, so a reader
   scrolling the conversation meets the change where it happened rather than only in the header. */

import { Fragment } from 'react';
import { clock, isCurrentTurn } from './Transcript.language';
import type { TranscriptTurn } from './Transcript.types';
import { GlobeGlyph } from './TranscriptChrome';
import { TranscriptTurnRow } from './TranscriptTurnRow';

interface TranscriptTurnListProps {
  /** The turns currently on screen — the window, not the whole call. */
  turns: TranscriptTurn[];
  /** Turn index → the language it switched to. */
  marks: Record<number, string>;
  currentAt?: number;
  agentName?: string;
  customerName?: string;
  onSeek?: (seconds: number) => void;
  density: 'expressive' | 'functional';
}

export function TranscriptTurnList({
  turns,
  marks,
  currentAt,
  agentName,
  customerName,
  onSeek,
  density,
}: TranscriptTurnListProps) {
  return (
    <ol className="hg-transcript-turns" data-density={density}>
      {turns.map((t, i) => {
        const switched = marks[i];
        const key = t.id ?? `${i}-${t.party}`;
        return (
          <Fragment key={key}>
            {switched ? (
              <li className="hg-transcript-switch">
                <span className="hg-transcript-globe">
                  <GlobeGlyph size={13} />
                </span>
                <span>
                  Switched to {switched}
                  {t.at !== undefined ? ` · ${clock(t.at)}` : ''}
                </span>
              </li>
            ) : null}
            <TranscriptTurnRow
              turn={t}
              current={isCurrentTurn(turns, i, currentAt)}
              agentName={agentName}
              customerName={customerName}
              onSeek={onSeek}
              density={density}
            />
          </Fragment>
        );
      })}
    </ol>
  );
}
