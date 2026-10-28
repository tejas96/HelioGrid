import type { TrancheTemplateRead } from '@heliogrid/domain';

/**
 * The board's tenant and its terms (`SCR-M01-20` m20-a, m20-n8), as a company types them — never a
 * word of the product's. Six in use, the default first, the two seeded ones untouched; two archived.
 */

const line = (
  en: string,
  percent: string,
  dueOnStage: TrancheTemplateRead['lines'][number]['dueOnStage'],
) => ({ label: { en }, percent, dueOnStage });

const template = (id: string, en: string, lines: TrancheTemplateRead['lines'], over = {}) => ({
  id,
  name: { en },
  isDefault: false,
  archived: false,
  changed: true,
  lines,
  ...over,
});

export const IN_USE: TrancheTemplateRead[] = [
  template(
    't1',
    'Standard 10/60/20/10',
    [
      line('Advance on signing', '10.00', 'won'),
      line('Before dispatch', '60.00', 'material_ordered'),
      line('On installation', '20.00', 'installation'),
      line('On commissioning', '10.00', 'commissioned'),
    ],
    { isDefault: true, changed: false },
  ),
  template(
    't2',
    'Standard 30/60/10',
    [
      line('Advance on signing', '30.00', 'won'),
      line('Before dispatch', '60.00', 'material_ordered'),
      line('On commissioning', '10.00', 'commissioned'),
    ],
    { changed: false },
  ),
  template('t3', 'Housing society, in thirds', [
    line('First instalment', '33.33', 'won'),
    line('Second instalment', '33.33', 'dispatched'),
    line('Final instalment', '33.34', 'commissioned'),
  ]),
  template('t4', 'Commercial, above 100 kWp', [
    line('Booking advance', '15.00', 'won'),
    line('Material', '55.00', 'material_ordered'),
    line('Installation', '20.00', 'installation'),
    line('Handover', '10.00', 'handed_over'),
  ]),
  template('t5', 'Government, PM Surya Ghar', [
    line('Booking', '20.00', 'won'),
    line('Installation', '60.00', 'installation'),
    line('On subsidy', '20.00', 'incentive_claimed'),
  ]),
  template('t6', 'Factory rooftop, staged', [
    line('Booking', '10.00', 'won'),
    line('Order', '30.00', 'material_ordered'),
    line('Dispatch', '30.00', 'dispatched'),
    line('Metering', '20.00', 'electrical_metering'),
    line('Handover', '10.00', 'handed_over'),
  ]),
];

export const ARCHIVED: TrancheTemplateRead[] = [
  template(
    'a1',
    'Subsidy-linked, 2024',
    [
      line('Booking', '30.00', 'won'),
      line('Installation', '50.00', 'installation'),
      line('On subsidy', '20.00', 'incentive_claimed'),
    ],
    { archived: true },
  ),
  template(
    'a2',
    'Standard 20/70/10 (old)',
    [
      line('Booking', '20.00', 'won'),
      line('Material', '70.00', 'material_ordered'),
      line('Commissioning', '10.00', 'commissioned'),
    ],
    { archived: true },
  ),
];

/** The board's letterhead (SCR-M01-18's saved branding). */
export const LETTERHEAD = {
  facts: {
    companyName: 'Suryodaya Solar Pvt Ltd',
    taxId: '27AABCS1429P1ZQ',
    taxIdLabel: 'GSTIN',
    address: 'Shop 14, Laxmi Complex, Baner Road, Pune 411045',
    letterhead: {
      tagline: 'Rooftop solar since 2011',
      lines: ['+91 98200 41123', 'suryodayasolar.in'],
    },
  },
  colour: '#0D7A4F',
};

/** The api's answer for the sample: ₹4,20,000, each share of it exact (`F4-04`). */
export function scheduleOf(percents: readonly string[]) {
  return {
    contract: '420000.00',
    amounts: percents.map((percent) => (Number(percent) * 4200).toFixed(2)),
  };
}
