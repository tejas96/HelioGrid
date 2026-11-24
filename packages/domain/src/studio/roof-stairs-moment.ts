import type { StairsShown } from './roof-stairs';

/** What the bar says about the stairs, when it has nothing else to say. */
export type StairsMoment = 'placing' | 'moving' | 'ask' | 'guessed';

/**
 * The bar's stairs line (board 7): placing first — the next tap is theirs; then a mark held; then,
 * with no stairs, the question; then a guess a drag can move. A person's stairs, or a reader, say
 * nothing.
 */
export function stairsMomentOf(facts: {
  readonly placing: boolean;
  readonly held: boolean;
  readonly ask: boolean;
  readonly stairs: StairsShown | null;
  readonly editable: boolean;
}): StairsMoment | null {
  if (!facts.editable) return null;
  if (facts.placing) return 'placing';
  if (facts.held) return 'moving';
  if (facts.ask) return 'ask';
  return facts.stairs !== null && !facts.stairs.byPerson ? 'guessed' : null;
}
