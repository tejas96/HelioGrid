import type { TenantSettings, TrancheTemplate } from '../../src/commerce/effective-settings';
import { STANDARD_TRANCHE_TEMPLATES } from '../../src/commerce/tranche-template-defaults';

/** A company that never opened settings: no row of its own anywhere. */
export const nothingSet: TenantSettings = {
  businessProfile: null,
  taxRegistrations: [],
  branding: null,
  proposalTemplate: null,
  timelineTemplate: null,
  trancheTemplates: [],
  holidays: [],
};

export const [standard] = STANDARD_TRANCHE_TEMPLATES;

/** The default split as tenant creation seeds it: the platform's, untouched. */
export const seeded: TrancheTemplate = {
  id: 'tt-1',
  name: standard.name,
  lines: standard.lines,
  isDefault: true,
  archived: false,
  changed: false,
};
