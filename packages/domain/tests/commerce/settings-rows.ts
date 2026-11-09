import type { TenantSettings, TrancheTemplate } from '../../src/commerce/effective-settings';
import { standardTrancheTemplates } from '../../src/commerce/tranche-template-defaults';

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

/** The two standard splits in fixed test words: their words are catalog copy, the shares domain's. */
export const standardSplits = standardTrancheTemplates({
  name: (split) => `Standard ${split}`,
  tranche: {
    on_signing: 'Advance on signing',
    before_dispatch: 'Before dispatch',
    on_installation: 'On installation',
    on_commissioning: 'On commissioning',
  },
});

export const [standard] = standardSplits;

/** The default split as tenant creation seeds it: the platform's, untouched. */
export const seeded: TrancheTemplate = {
  id: 'tt-1',
  name: standard.name,
  lines: standard.lines,
  isDefault: true,
  archived: false,
  changed: false,
};
