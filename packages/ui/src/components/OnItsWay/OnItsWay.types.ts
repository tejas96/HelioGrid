import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

/**
 * A page whose module has not landed yet — a door the shell already offers, a settings row still to
 * come (`F7-48`: no control is dead). It says, honestly, what the page will do: its name, a badge,
 * one line and up to three things it will hold, a sunrise moment as its art, and one way on. It
 * shows no figure and no record, since none exists yet.
 */
export interface OnItsWayProps {
  /** The page's name — its heading. */
  title: TranslatedText;
  /** The overline on the hero — *On its way*. */
  badge: TranslatedText;
  /** What the page will do, in one sentence. */
  line: TranslatedText;
  /** Up to three things it will hold, each a short line. */
  points: readonly TranslatedText[];
  /** Under the points: what the person can rely on until then. */
  meanwhile: TranslatedText;
  /** One way on — a button home. */
  action?: ReactNode;
}
