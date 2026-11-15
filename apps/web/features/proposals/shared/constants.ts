import { theme } from '@heliogrid/theme';

/**
 * The room from which a proposal page stands as the desktop's: the breadcrumb above the title, the
 * list as a table, the document with its thumbnails. Measured on the page's own room, once the
 * shell's sidebar has taken its share; below it the phone's layout stands, every part still in it.
 */
export const PROPOSAL_WIDE_FROM = theme.layout['bp-desktop'] - theme.layout['sidebar-w'];

/** The proposals list's table needs the leads table's room: seven columns on one line. */
export const PROPOSALS_TABLE_FROM = theme.layout['bp-desktop'];
