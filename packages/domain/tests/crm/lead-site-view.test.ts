import { describe, expect, it } from 'vitest';
import { type LeadSiteView, leadSiteViewOf } from '../../src/crm/lead-site-view';

const SITE = {
  address: '12 Baner Road, Pune',
  area: { area: 'IN-MH', district: 'Pune' },
  sanctionedLoadKw: 5,
  supplyPhase: 'single',
} as const;
const NO_SITE = { address: null, area: null, sanctionedLoadKw: null, supplyPhase: null } as const;
const VISIT = { id: 'visit-1', address: 'Flat 4, Sunrise Towers, Baner' } as const;

describe('leadSiteViewOf — the Site section shows the lead’s own facts; only a booked visit confirms the address', () => {
  it.each<
    [
      string,
      Parameters<typeof leadSiteViewOf>[0],
      Parameters<typeof leadSiteViewOf>[1],
      LeadSiteView,
    ]
  >([
    ['nothing known', null, undefined, { ...NO_SITE, confirmed: false }],
    ['an older api without the site', null, undefined, { ...NO_SITE, confirmed: false }],
    ['the proposal typed the site', null, SITE, { ...SITE, confirmed: false }],
    [
      'a booked visit confirms its own address',
      VISIT,
      SITE,
      { ...SITE, address: VISIT.address, confirmed: true },
    ],
    [
      'a booked visit, no site typed',
      VISIT,
      NO_SITE,
      { ...NO_SITE, address: VISIT.address, confirmed: true },
    ],
  ])('%s', (_case, visit, site, view) => {
    expect(leadSiteViewOf(visit, site)).toEqual(view);
  });
});
