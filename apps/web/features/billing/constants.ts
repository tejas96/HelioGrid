import { settingsRowPath } from '../settings';

/** Billing's address under the settings list (`SETTINGS_SEGMENT.billing`). */
export const BILLING_PATH = settingsRowPath('billing');

/** `SCR-M12-03`'s route — the plans. */
export const BILLING_PLANS_PATH = `${BILLING_PATH}/plans`;
