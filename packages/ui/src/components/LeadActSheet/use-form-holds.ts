import { useCallback, useEffect, useState } from 'react';

/**
 * Whether the open form holds something a close would lose (`M02-32`: typing is never dropped
 * without an ask): each form reports it through `report`, and the sheet reads `holding` before a
 * way out. A form that closes reports nothing more, so the sheet forgets it with the form.
 */
export function useSheetHolds(open: boolean) {
  const [holding, setHolding] = useState(false);
  useEffect(() => {
    if (!open) setHolding(false);
  }, [open]);
  const report = useCallback((holds: boolean) => setHolding(holds), []);
  return { holding, report, forget: () => setHolding(false) };
}

/** A form's report to its sheet: whether it holds a typed or picked answer not yet sent. */
export function useReportHolds(report: (holds: boolean) => void, holds: boolean): void {
  useEffect(() => {
    report(holds);
  }, [report, holds]);
  // A form that leaves — swapped for the next one in the same open sheet — holds nothing more.
  useEffect(() => () => report(false), [report]);
}
