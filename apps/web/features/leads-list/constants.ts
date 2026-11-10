import { theme } from '@heliogrid/theme';

/**
 * The room from which the list stands as the desktop's table — the page's own width once the
 * desktop shell's sidebar takes its share: the stages as one band, every column side by side.
 * Below it, the phone's card of rows under the meter's card.
 */
export const LEADS_TABLE_FROM = theme.layout['bp-desktop'] - theme.layout['sidebar-w'];
