import type { TranslatedText } from '@heliogrid/contracts';
import type { AccordionItem, StandingPlace } from './Accordion.types';
import { accordionStateWord, standingPlace } from './Accordion.types';

/** The standing's word when the header draws it at `place` — nothing at the other place. */
export function standingWordAt(
  item: AccordionItem,
  place: StandingPlace,
): TranslatedText | undefined {
  return standingPlace(item) === place ? accordionStateWord(item) : undefined;
}
