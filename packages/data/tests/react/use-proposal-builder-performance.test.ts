// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { mounted, stepOf } from './proposal-builder-mounted';
import { proposalDetail } from './proposals-fixtures';
import { sell } from './proposals-origin';
import { originActs } from './proposals-origin-acts';

/**
 * Step 4's card names what the fill was asked for (`M06-10`): the draft's own place and size, read
 * from the lead and step 3 — never from a preview that may not exist yet. The place is the district
 * where one is picked, else the state's name; a fact the draft does not hold is `null`.
 */
describe('step 4 — the place and size a fill is asked for', () => {
  it.each([
    [{ area: 'IN-MH', district: 'Pune' }, 3, { place: 'Pune', capacityKw: 3 }],
    [{ area: 'IN-MH', district: null }, 3, { place: 'Maharashtra', capacityKw: 3 }],
    [{ area: 'XX-ZZ', district: null }, 3, { place: null, capacityKw: 3 }],
    [null, 3, { place: null, capacityKw: 3 }],
    [{ area: 'IN-MH', district: 'Pune' }, null, { place: 'Pune', capacityKw: null }],
  ])('area %o at %s kW asks for %o', async (area, capacityKw, asked) => {
    const draft = proposalDetail({});
    draft.document.deal.area = area;
    draft.document.fields.system.capacityKw = capacityKw;
    sell.proposal = draft;
    /* The step's own first fill answers the same draft back, its place and size untouched. */
    originActs.filledMonths = Array.from({ length: 12 }, () => 300);
    const { view } = await mounted('performance');
    expect(stepOf(view.result.current, 'performance').asked).toEqual(asked);
  });
});
