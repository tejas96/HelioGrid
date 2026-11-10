import { theme } from '@heliogrid/theme';
import { DOOR_PATH } from '../shell';

/** Where the page's ways back lead: the leads list, under the Leads door. */
export const LEADS_PATH = DOOR_PATH.leads;

/**
 * Quick add for a lead this customer referred (`M02-16`): the add door with the referrer named.
 * The quick add screen reads `referredBy`.
 */
export const referralPath = (leadId: string): string =>
  `${DOOR_PATH.add_lead}?referredBy=${encodeURIComponent(leadId)}`;

/** Customer merge with this customer as the survivor, and the other record when known (`SCR-M02-06`). */
export const mergePath = (survivorId: string, loserId?: string): string =>
  `/customers/merge?survivorId=${encodeURIComponent(survivorId)}${
    loserId === undefined ? '' : `&loserId=${encodeURIComponent(loserId)}`
  }`;

/**
 * The room from which the page stands as the desktop's two columns — hero, actions and qualify on
 * the left, the sections and contacts on the right: the page's own width once the desktop shell's
 * sidebar takes its share. Below it, the phone's one column.
 */
export const LEAD_DETAIL_COLUMNS_FROM = theme.layout['bp-desktop'] - theme.layout['sidebar-w'];
