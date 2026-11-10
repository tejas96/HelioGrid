import { theme } from '@heliogrid/theme';

/**
 * The room from which the compare and its hero stand side by side — the page's own width once the
 * desktop shell's sidebar takes its share. Below it, the phone's one column, the hero under the
 * compare.
 */
export const MERGE_COLUMNS_FROM = theme.layout['bp-desktop'] - theme.layout['sidebar-w'];
