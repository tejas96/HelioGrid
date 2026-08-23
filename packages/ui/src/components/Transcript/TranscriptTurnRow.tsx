/* Transcript's turn (web) — the speaker in ActorClass's own words and glyph, the offset as a real
   44px seek control when the recording is still playable, and the words themselves.

   Every turn states its speaker: a conversation alternates, so there is no run of turns for a
   heading to cover. */

import { Pressable } from '../../primitives/Pressable';
import { ACTOR_CLASSES, ActorGlyph } from '../ActorClass';
import { renderMarks } from '../ChipGroup';
import { clock } from './Transcript.language';
import type { TranscriptParty, TranscriptTurn } from './Transcript.types';

const PARTY_CLASS = { agent: 'agent', customer: 'customer' } as const;
const PARTY_WORD: Record<TranscriptParty, string> = { agent: 'Agent', customer: 'Customer' };

/** The offset. A real 44px control with `onSeek`; legible text without it. */
function Offset({
  at,
  onSeek,
  current,
  title,
}: {
  at?: number;
  onSeek?: (seconds: number) => void;
  current: boolean;
  title: string;
}) {
  const label = clock(at);
  if (label === null || at === undefined) {
    return <span className="hg-transcript-offset-spacer" />;
  }
  const face = (
    <span className="hg-transcript-offset-face" data-current={current ? 'true' : undefined}>
      {label}
    </span>
  );
  if (!onSeek) {
    return <span className="hg-transcript-offset">{face}</span>;
  }
  return (
    <Pressable
      className="hg-transcript-seek"
      onPress={() => onSeek(at)}
      accessibilityLabel={`Play the call from ${label}, ${title}`}
    >
      {face}
    </Pressable>
  );
}

export function TranscriptTurnRow({
  turn,
  current,
  agentName,
  customerName,
  onSeek,
  density,
}: {
  turn: TranscriptTurn;
  current: boolean;
  agentName?: string;
  customerName?: string;
  onSeek?: (seconds: number) => void;
  density: 'expressive' | 'functional';
}) {
  const party: TranscriptParty = turn.party === 'customer' ? 'customer' : 'agent';
  const isAgent = party === 'agent';
  const name = isAgent ? agentName : customerName;
  const descriptor = ACTOR_CLASSES[PARTY_CLASS[party]];
  return (
    <li className="hg-transcript-turn">
      <Offset at={turn.at} onSeek={onSeek} current={current} title={`${PARTY_WORD[party]} turn`} />
      <div
        className="hg-transcript-bubble"
        data-party={party}
        data-current={current ? 'true' : undefined}
        data-density={density}
      >
        {/* The speaker, in ActorClass's own words and glyph — the stream's vocabulary, not a
            second one. */}
        <span className="hg-transcript-speaker" data-party={party}>
          <span className="hg-transcript-speaker-glyph">
            <ActorGlyph actorClass={PARTY_CLASS[party]} size={13} />
          </span>
          {name ? `${name} · ${PARTY_WORD[party].toLowerCase()}` : descriptor.word()}
        </span>
        <p className="hg-transcript-words" data-density={density}>
          {turn.text}
        </p>
        {turn.marks ? <div className="hg-transcript-marks">{renderMarks(turn.marks)}</div> : null}
      </div>
    </li>
  );
}
