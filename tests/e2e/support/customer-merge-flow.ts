import { CUSTOMER_MERGE, createTranslator, customerMergeWords } from '@heliogrid/i18n';

/*
 * Customer Merge's words for its phone flow (`SCR-M02-06`, `mobile/customer-merge.yaml`), handed to
 * Maestro by `mobile-cli.ts`, which reads no file mid-flow.
 */

/**
 * The title, the step's act, the confirm's facts — what moves, no money, cannot be undone — the
 * act, and the calm done with Open customer.
 */
export function customerMergeFlowWords(
  t: Awaited<ReturnType<typeof createTranslator>>,
): Record<string, string> {
  const merge = customerMergeWords(t.t);
  return {
    MERGE_TITLE: merge.title,
    WHICH_STAYS: t.t(CUSTOMER_MERGE.whichStays),
    REVIEW_MERGE: merge.review,
    CONFIRM_MERGE: merge.confirmTitle,
    WHAT_MOVES: t.t(CUSTOMER_MERGE.movesHeading),
    NO_MONEY: t.t(CUSTOMER_MERGE.noMoney),
    CANNOT_UNDO: merge.cannotUndo,
    MERGE_ACT: merge.merge,
    MERGED: merge.done.title,
    OPEN_CUSTOMER: merge.done.openCustomer,
  };
}

/** The line under each value a record holds — "From <name>" — for the record the flow keeps. */
export async function mergeFromLine(name: string): Promise<string> {
  const t = await createTranslator('en');
  return customerMergeWords(t.t).from(name);
}
