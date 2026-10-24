/**
 * The filter body's own words (`FilterPanel`, design-system change 8): `packages/i18n` writes
 * them, `packages/ui` draws them, so the shape is held once here.
 */

/** Every word the filter body draws that a dimension does not carry: `packages/i18n`'s `filterPanelWords`. */
export interface FilterSetWords {
  /** The last section's title, over every flag — *Show*. */
  readonly show: string;
  /** Under a chip list longer than six — *Show all 9 kinds*; *Show all 9* without a noun. */
  readonly showAll: (count: number, noun?: string) => string;
  /** At a facet's right while several of its values are on — *3 selected*. */
  readonly selected: (count: number) => string;
  /** At a folded line's right while filters inside it are on — *2 on*. */
  readonly groupOn: (count: number) => string;
}

/** The panel's own words on top of the body's: its title and its footer. */
export interface FilterPanelWords extends FilterSetWords {
  readonly title: string;
  readonly clearAll: string;
  /** The footer's dismiss while no result count is known. */
  readonly done: string;
  /** *Show 24 items* — `noun` is the panel's `resultNoun`; without one, *Show 24 results*. */
  readonly showResults: (count: number, noun?: string) => string;
}
