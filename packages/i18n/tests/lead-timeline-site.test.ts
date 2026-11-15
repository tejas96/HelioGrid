import { IN_FORMATS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { type LeadTimelineEntryFacts, leadTimelineEntryWords } from '../src/copy/lead-timeline';
import { createTranslator } from '../src/runtime';

const formats = {
  pack: IN_FORMATS,
  day: (date: string) => date,
  time: (hhmm: string) => hhmm,
  word: (kind: 'stage' | 'party' | 'reason' | 'row' | 'step' | 'area', key: string) =>
    kind === 'area' && key === 'IN-MH' ? 'Maharashtra' : key,
};

function edit(field: string, from: string | null, to: string | null): LeadTimelineEntryFacts {
  return {
    known: true,
    activity: {
      id: 'entry-1',
      kind: 'field_change',
      appliedAt: '2026-11-14T08:00:00.000Z',
      actor: { kind: 'user', name: 'Asha Patil' },
      body: { field, from, to },
    },
  } as unknown as LeadTimelineEntryFacts;
}

describe('the lead timeline names the site facts a proposal writes on the lead (M06-09, M06-16)', () => {
  it.each<[string, string | null, string | null, string, string]>([
    ['siteAddress', null, '12 Baner Road', 'Site address changed', 'Not set → 12 Baner Road'],
    // The server writes the region by its code, which is never shown: the pack names it.
    [
      'area',
      'Nashik · IN-MH',
      'Pune · IN-MH',
      'District changed',
      'Nashik · Maharashtra → Pune · Maharashtra',
    ],
    // The state alone set, or moved: the entry names the state, never the district.
    ['area', null, 'IN-MH', 'State changed', 'Not set → Maharashtra'],
    ['area', 'IN-KA', 'Pune · IN-MH', 'State changed', 'IN-KA → Pune · Maharashtra'],
    ['area', 'IN-MH', 'Pune · IN-MH', 'District changed', 'Maharashtra → Pune · Maharashtra'],
    ['area', 'Pune · IN-MH', null, 'State changed', 'Pune · Maharashtra → Not set'],
    ['sanctionedLoadKw', '3', '5', 'Sanctioned load changed', '3 kW → 5 kW'],
    ['sanctionedLoadKw', null, '5', 'Sanctioned load changed', 'Not set → 5 kW'],
    ['supplyPhase', null, 'single', 'Supply changed', 'Not set → single phase'],
    ['supplyPhase', 'single', 'three', 'Supply changed', 'single phase → three phase'],
  ])('%s', async (field, from, to, summary, detail) => {
    const { t } = await createTranslator('en');
    const words = leadTimelineEntryWords(t, formats, edit(field, from, to));
    expect(words.summary).toBe(summary);
    expect(words.detail).toBe(detail);
  });
});
