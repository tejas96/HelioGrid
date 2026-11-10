import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { MenuItem } from '../Menu/Menu.types';

/**
 * **The one hero a screen has: solar glass** (`CLAUDE.md` §10). The card colour lit from the top
 * right by the logo's green and teal, a faint PV-cell grid where the light falls (so words on the
 * left stay clean), and a 2 px logo-gradient line along its top. In dark it is the deep ocean.
 * It holds what the screen is about — a plan, a release, a month's money — and nothing else.
 */
export interface HeroPanelProps {
  /** The quiet overline that names what the hero is about. */
  readonly label?: TranslatedText;
  /** Beside the overline: a provenance pill, a status. */
  readonly labelAside?: ReactNode;
  /** The region's name for a screen reader, when the overline is absent. */
  readonly name?: TranslatedText;
  /** The ⋯ in the top-right corner: the acts on the whole thing the hero is about. */
  readonly menu?: HeroPanelMenu;
  readonly children: ReactNode;
}

/**
 * The hero's corner menu: a glass ⋯ like the hero's chips. The first row of the hero leaves room
 * for it, so a long name or a row of chips never runs under it.
 */
export interface HeroPanelMenu {
  /** The menu's spoken name — "More actions". */
  readonly label: TranslatedText;
  readonly items: MenuItem[];
  /** Off while an act the menu offers is already out. */
  readonly disabled?: boolean;
}
