import { theme } from '@heliogrid/theme';

/**
 * The room from which Site details stands in two columns: the page's own width once the desktop
 * shell's sidebar takes its share. Below it, the phone's one column.
 */
export const SITE_DETAILS_WIDE_FROM = theme.layout['bp-desktop'] - theme.layout['sidebar-w'];
