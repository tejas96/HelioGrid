import type { ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { ButtonProps } from '../Button/Button.types';
import type { FacetChipsProps } from '../FilterBar/FilterBar.types';
import type { MenuProps } from '../Menu/Menu.types';
import type { SearchFieldProps } from '../SearchField/SearchField.types';
import type { SegmentedControlProps } from '../SegmentedControl/SegmentedControl.types';
import type { StageMeterProps } from '../StageMeter/StageMeter.types';
import type { LeadsListFilterBarProps } from './LeadsListFilterBar.types';

/** The one chip's value: only the leads thirty quiet days flagged (`M02-52`). */
const DORMANT = 'dormant';

/** Each control of the bar as both halves draw it; a null part is not drawn. */
export interface LeadsListFilterBarParts {
  /** Whose leads and the inbox — null when there is no choice to make. */
  readonly whose: SegmentedControlProps | null;
  readonly meter: StageMeterProps;
  readonly search: SearchFieldProps;
  readonly dormant: FacetChipsProps;
  /** The Bill chip — null where the table's column orders the bill. */
  readonly bill: ButtonProps | null;
  /** The source menu, a switcher; its trigger says the source chosen, else the menu's name. */
  readonly sourceMenu: Omit<MenuProps, 'trigger'>;
  readonly sourceTrigger: ButtonProps;
}

/**
 * The bar's controls from the list's screen: what each shows as set, and what each press sets.
 * `glyph` is the half's own `ShellGlyph` at the chips' size.
 */
export function leadsListFilterBarPartsOf(
  { screen, pipeline, form, onInbox, words }: LeadsListFilterBarProps,
  glyph: (name: ShellGlyphName) => ReactNode,
): LeadsListFilterBarParts {
  const { filters, whoseChoices } = screen;
  const whoseOffered = whoseChoices.length > 1 || screen.inboxOffered;
  return {
    whose: whoseOffered
      ? {
          ariaLabel: words.whoseLabel,
          value: filters.whose,
          /* The segments are the reader's scopes and the inbox: any other value is the inbox. */
          onChange: (value) => {
            const whose = whoseChoices.find((one) => one === value);
            if (whose === undefined) onInbox();
            else screen.setWhose(whose);
          },
          options: words.whoseOptions(screen),
        }
      : null,
    meter: {
      form,
      stages: pipeline.stages,
      chosen: filters.stage,
      onPick: screen.pickStage,
      words: words.meter(pipeline.open),
    },
    search: {
      value: filters.query,
      onChange: screen.setQuery,
      placeholder: words.searchHint,
      ariaLabel: words.search,
      onClear: () => screen.setQuery(''),
      clearLabel: words.clearSearch,
    },
    dormant: {
      label: words.filters,
      selectedLabel: words.selected,
      options: [{ value: DORMANT, label: words.dormant, icon: glyph('moon') }],
      values: filters.dormant ? [DORMANT] : [],
      counts: { [DORMANT]: pipeline.dormant },
      onChange: screen.toggleDormant,
    },
    bill:
      form === 'band'
        ? null
        : {
            variant: 'secondary',
            size: 'sm',
            icon: glyph('sort'),
            onClick: screen.stepBillSort,
            children: words.bill(filters.sort),
          },
    sourceMenu: {
      label: words.source,
      selection: 'single',
      items: words.sourceChoices.map(({ key, label, source }) => ({
        key,
        label,
        selected: filters.source === source,
        onSelect: () => screen.setSource(source),
      })),
    },
    sourceTrigger: {
      variant: 'secondary',
      size: 'sm',
      iconRight: glyph('caret-down'),
      children: filters.source === null ? words.source : words.sourceWord(filters.source),
    },
  };
}
