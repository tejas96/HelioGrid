import { DOOR_SEGMENT } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';

export { LEAD_INBOX_PATH, leadPath } from '../shell';

/** Where the teaching inbox sends an import (`SCR-M02-05`). */
export const LEAD_IMPORT_PATH = `/${DOOR_SEGMENT.leads}/import`;

/**
 * The room from which the inbox stands as the desktop's stage — the page's own width once the
 * desktop shell's sidebar takes its share: the lead, its bill and its age ring side by side over
 * the docked team, the queue as tiles under it. Below it, the phone's deck.
 */
export const INBOX_STAGE_FROM = theme.layout['bp-desktop'] - theme.layout['sidebar-w'];
