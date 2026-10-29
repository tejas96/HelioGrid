import type { TranslatedText } from '@heliogrid/contracts';
import type { TranscriptParty, TranscriptTurn, TranscriptWords } from './Transcript.types';

/**
 * Which actor class a party is drawn as. Declared once because both halves look the descriptor
 * and the glyph up through it, and a party added to one map only would draw an unstyled turn.
 */
export const PARTY_CLASS = { agent: 'agent', customer: 'customer' } as const;

/** **Who spoke a turn, in ActorClass's own words** — the stream's vocabulary, not a second one. */
export function speakerOf(
  turn: TranscriptTurn,
  agentName: string | undefined,
  customerName: string | undefined,
  words: TranscriptWords,
): { party: TranscriptParty; label: TranslatedText } {
  const party: TranscriptParty = turn.party === 'customer' ? 'customer' : 'agent';
  const name = party === 'agent' ? agentName : customerName;
  return {
    party,
    label: name
      ? words.actor.named[PARTY_CLASS[party]](name)
      : words.actor.unnamed[PARTY_CLASS[party]],
  };
}
