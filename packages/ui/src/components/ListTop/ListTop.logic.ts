import type { TranslatedText } from '@heliogrid/contracts';
import type { ListFilterProps, ListSortProps } from './ListTop.types';

/** The chosen order's words; an order the choices do not hold reads as the first choice. */
export function chosenSortOf(sort: ListSortProps): TranslatedText {
  const chosen = sort.choices.find((choice) => choice.key === sort.chosen) ?? sort.choices[0];
  return chosen?.label ?? sort.title;
}

/** A side figure's tile: its glyph on its tint, at the tile size a list's summary takes. */
export const FIGURE_TILE = { size: 32 } as const;

/** The filter body's key for the order, beside the list's own dimensions. */
const SORT_KEY = 'list-order';

/** The parts of a list's filter body the order joins. */
export type ListFilterBody = Pick<ListFilterProps, 'dimensions' | 'value' | 'onChange' | 'onClear'>;

/**
 * The narrow room's one filter body: the order first, as a choice of one, then the list's own
 * filters — so the search keeps one circle beside it. The order is no filter: the circle's count
 * leaves it out, and *Clear* puts the first order back with the rest.
 */
export function filterWithSortOf(
  filter: ListFilterBody,
  sort: Pick<ListSortProps, 'title' | 'choices' | 'chosen' | 'onChoose'>,
): ListFilterBody {
  const first = sort.choices[0]?.key ?? sort.chosen;
  return {
    dimensions: [
      {
        kind: 'one-of',
        key: SORT_KEY,
        label: sort.title,
        allValue: first,
        options: sort.choices.map((choice) => ({ value: choice.key, label: choice.label })),
      },
      ...filter.dimensions,
    ],
    value: { ...filter.value, [SORT_KEY]: sort.chosen },
    onChange: (value) => {
      const { [SORT_KEY]: order, ...rest } = value;
      if (typeof order === 'string' && order !== sort.chosen) sort.onChoose(order);
      else filter.onChange(rest);
    },
    onClear: () => {
      if (sort.chosen !== first) sort.onChoose(first);
      filter.onClear();
    },
  };
}
