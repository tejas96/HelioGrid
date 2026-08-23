/* The header of one transcript (web) — its name, the call's identity line, THE ONE LANGUAGE LABEL,
   why the words are here without the audio, and the count line. */

import { NamedGap } from '../NamedGap';
import { GlobeGlyph } from './TranscriptChrome';

interface TranscriptHeaderProps {
  title: string;
  meta?: string;
  /** The whole language fact in one sentence, or `null` when it was never recorded. */
  sentence: string | null;
  retainedNote?: string;
  /** "12 turns · Suryodaya agent and Anil Kulkarni", only once the turns are actually here. */
  count: string | null;
}

export function TranscriptHeader({
  title,
  meta,
  sentence,
  retainedNote,
  count,
}: TranscriptHeaderProps) {
  return (
    <div className="hg-transcript-header">
      <p className="hg-transcript-title">{title}</p>
      {meta ? <p className="hg-transcript-meta">{meta}</p> : null}
      {/* The language label — one per transcript, saying the whole shape of what happened. */}
      {sentence ? (
        <p className="hg-transcript-language">
          <span className="hg-transcript-globe">
            <GlobeGlyph />
          </span>
          {sentence}
        </p>
      ) : (
        <NamedGap gap="Language not recorded" scale="field" />
      )}
      {retainedNote ? <p className="hg-transcript-retained">{retainedNote}</p> : null}
      {count ? <p className="hg-transcript-count">{count}</p> : null}
    </div>
  );
}
