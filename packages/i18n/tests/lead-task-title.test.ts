import { describe, expect, it } from 'vitest';
import { leadTaskTitle } from '../src/copy/lead-task-title';
import { createTranslator } from '../src/runtime';

describe('a task raised by the customer’s answer says the next act, naming the link (M06-55, T-F5-008)', () => {
  it.each<[string, string | null, string]>([
    ['proposal_accepted', 'Anil · Anil Sharma', 'Confirm won · Anil · Anil Sharma'],
    ['proposal_accepted', null, 'Confirm won'],
    ['proposal_declined', 'Anil', 'Anil declined — call, then mark lost or share again'],
    ['proposal_declined', null, 'Customer declined — call, then mark lost or share again'],
    ['manual', 'Bring the meter photo', 'Bring the meter photo'],
    ['proposal_shared', null, 'Follow-up'],
  ])('%s, titled %s', async (provenance, title, words) => {
    const { t } = await createTranslator('en');
    expect(leadTaskTitle(t, { kind: 'follow_up', title, provenance })).toBe(words);
  });
});
