/**
 * Sheet and DetailPanel pull the button back by 8/10; Modal's roomier header by 10/12. Under a
 * handle `handle` pulls only sideways. Each half says why beside its offsets or its close.
 */
export type OverlayCloseOffset = 'sheet' | 'modal' | 'handle';

export interface OverlayCloseProps {
  onClick?: () => void;
  offset?: OverlayCloseOffset;
  /** The accessible name, from `packages/i18n`: the caller's `closeLabel`, never an English default. */
  label: string;
}

/** The words every overlay that draws this close takes from its caller. */
export interface OverlayCloseWords {
  /**
   * The close button's name, from `packages/i18n`. Required even where no close draws, so no
   * overlay ever speaks an English one.
   */
  closeLabel: string;
}
