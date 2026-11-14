import type { ProposalList } from '@heliogrid/contracts';
import { PROPOSAL_LIST_FILTERS, type ProposalListFilter } from '@heliogrid/domain';
import type { PickLeadSheetProps } from './ProposalList.types';

/** The filter chips in order, each with how many proposals it holds — whatever filter is on. */
export function filterChips(
  counts: ProposalList['counts'] | null,
): readonly { readonly filter: ProposalListFilter; readonly count: number | undefined }[] {
  return PROPOSAL_LIST_FILTERS.map((filter) => ({ filter, count: counts?.[filter] }));
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
