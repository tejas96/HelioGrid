import type { CancelReason } from '@heliogrid/domain';
import type { MessageRef } from '../runtime';

/**
 * Why a project was cancelled (`M08-51`), one word per reason — the cancel sheet offers them, the
 * project and the manager's notice name them.
 */
export const CANCEL_REASON_WORDS: Record<CancelReason, MessageRef> = {
  customer_backed_out: /*i18n*/ { id: 'Customer backed out' },
  won_by_mistake: /*i18n*/ { id: 'Won by mistake' },
  site_not_suitable: /*i18n*/ { id: 'Site not suitable' },
  lost_to_another_company: /*i18n*/ { id: 'Lost to another company' },
  something_else: /*i18n*/ { id: 'Something else' },
};
