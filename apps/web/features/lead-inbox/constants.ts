import { DOOR_SEGMENT } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';

/** The inbox's address (`SCR-M02-02`): under the Leads door, as the phone's link is. */
export const LEAD_INBOX_PATH = `/${DOOR_SEGMENT.leads}/inbox`;

/** One lead's page, which a queued lead's name opens (`SCR-M02-04`). */
export const leadPath = (leadId: string): string => `/${DOOR_SEGMENT.leads}/${leadId}`;

/** Where the teaching inbox sends an import (`SCR-M02-05`). */
export const LEAD_IMPORT_PATH = `/${DOOR_SEGMENT.leads}/import`;

/**
 * The room from which the inbox stands as the desktop's stage — the page's own width once the
 * desktop shell's sidebar takes its share: the lead, its bill and its age ring side by side over
 * the docked team, the queue as tiles under it. Below it, the phone's deck.
 */
export const INBOX_STAGE_FROM = theme.layout['bp-desktop'] - theme.layout['sidebar-w'];
