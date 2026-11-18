import type { ProposalEntries } from '@heliogrid/contracts';
import { PROPOSAL_ENTRY_FILTERS, type ProposalEntryFilter } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import type { PickLeadSheetProps, ProposalListProps } from './ProposalList.types';

/** The 3D chip's and the 3D mark's glyph: a model, boxed. */
export const THREE_D_GLYPH: ShellGlyphName = 'package';

/**
 * The filter chips in order, each with how many rows it holds — whatever filter is on. The 3D chip
 * is first and a rule stands after it: it filters by kind, the others by where a proposal stands.
 */
export function filterChips(counts: ProposalEntries['counts'] | null): readonly {
  readonly filter: ProposalEntryFilter;
  readonly count: number | undefined;
  readonly glyph: ShellGlyphName | undefined;
  readonly ruleAfter: boolean;
}[] {
  return PROPOSAL_ENTRY_FILTERS.map((filter) => ({
    filter,
    count: counts?.[filter],
    glyph: filter === '3d' ? THREE_D_GLYPH : undefined,
    ruleAfter: filter === '3d',
  }));
}

/** What an empty read says: the 3D chip names how a design starts; any other chip the list's own. */
export function emptyWordsOf(props: Pick<ProposalListProps, 'filter' | 'words'>) {
  const { words } = props;
  return props.filter === '3d'
    ? { title: words.empty3dTitle, description: words.empty3dLine }
    : { title: words.emptyTitle, description: words.emptyLine };
}

/** A proposal that was replaced or withdrawn sinks back: it is history, not work. */
export function isQuietStanding(standing: string): boolean {
  return standing === 'replaced' || standing === 'withdrawn';
}

/** The lead picker's frame and its search on both halves: no way out, and no typing, while a pick is out. */
export function pickLeadSheetOf(props: PickLeadSheetProps) {
  const { words } = props;
  const out = props.pendingId !== null;
  return {
    out,
    sheet: {
      open: props.open,
      onClose: () => {
        if (!out) props.onClose();
      },
      closeLabel: words.close,
      title: words.title,
      dismissible: !out,
    },
    search: {
      value: props.query,
      onChange: props.onQuery,
      placeholder: words.searchPlaceholder,
      ariaLabel: words.searchLabel,
      onClear: () => props.onQuery(''),
      clearLabel: words.clearSearch,
      disabled: out,
    },
  };
}
