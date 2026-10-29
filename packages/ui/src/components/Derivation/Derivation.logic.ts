import type { TranslatedText } from '@heliogrid/contracts';
import type { DerivationKindWords, DerivationPart } from './Derivation.types';

/** A part's React key: its kind and its sentence, or its place where the text is not a string. */
export function derivationPartKey(part: DerivationPart, position: number): string {
  return `${part.kind}-${typeof part.text === 'string' ? part.text : position}`;
}

/** A part's heading: its own label, or its kind's word. */
export function derivationPartHeading(
  part: DerivationPart,
  kindWords: DerivationKindWords,
): TranslatedText {
  return part.label ?? kindWords[part.kind];
}
