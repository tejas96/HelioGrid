import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

/**
 * A card's head that opens and closes its body (`CLAUDE.md` §10, cards that expand when needed):
 * the card's overline name, a short standing beside it, any marks, and a chevron that turns. The
 * whole row is the one toggle; a screen reader hears the name and whether it is open.
 */
export interface FoldHeadProps {
  /** The card's name — "Qualify". */
  readonly title: TranslatedText;
  /** Its standing beside the name — "2 of 6". */
  readonly meta?: TranslatedText;
  /** Marks after the standing, for the eye only — the qualify dots. */
  readonly aside?: ReactNode;
  readonly open: boolean;
  readonly onToggle: () => void;
}
