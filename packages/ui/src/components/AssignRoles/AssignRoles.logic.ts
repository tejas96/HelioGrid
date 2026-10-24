import type { LoadingBarSize } from '../LoadingBars/LoadingBars.types';

/** The cluster shows four discs, then its own *+N* (`AvatarGroup`). */
export const GRANT_DISCS_SHOWN = 4;

/** The grant cluster's disc size, in px (`SCR-M01-13`, `size: 36`). */
export const GRANT_DISC_SIZE = 36;

/** At or above this layer width the editor is the side panel, whose width the board gives (560). */
export const ASSIGN_ROLES_PANEL_WIDTH = 560;

/** The skeleton draws nine option cards — as many as the board's sheet shows before it scrolls. */
export const OPTION_BARS: readonly LoadingBarSize[] = Array.from({ length: 9 }, () => 'option');
