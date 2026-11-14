import { describe, expect, it } from 'vitest';
import { ownerDashboardWords } from '../src/copy/owner-dashboard';
import { createTranslator } from '../src/runtime';

describe('a sent proposal nobody opened, as Needs you now says it (M13-15)', () => {
  it.each<[string | null, number, string]>([
    ['Anil', 0, 'Anil has not opened it yet'],
    ['Anil', 1, 'Anil has not opened it for 1 day'],
    ['Anil', 3, 'Anil has not opened it for 3 days'],
    [null, 0, 'Not opened yet'],
    [null, 2, 'Not opened for 2 days'],
  ])('%s, %i days', async (name, days, line) => {
    const { t } = await createTranslator('en');
    expect(ownerDashboardWords(t).unopenedLine(name, days)).toBe(line);
  });
});
