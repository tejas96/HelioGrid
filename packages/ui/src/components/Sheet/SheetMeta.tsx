import type { ReactNode } from 'react';

/** The row between the header and the body, drawn only when the caller gave one. */
export function SheetMeta({ meta }: { meta: ReactNode }) {
  return meta === undefined || meta === null ? null : <div className="hg-sheet-meta">{meta}</div>;
}
