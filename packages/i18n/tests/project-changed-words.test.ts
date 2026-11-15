import { describe, expect, it } from 'vitest';
import { projectEntryWords } from '../src/copy/project-timeline';
import { createTranslator } from '../src/runtime';

const formats = { word: (_kind: string, key: string) => key, day: (date: string) => date };
const PROJECT = '018f0000-0000-7000-8000-000000000002';

describe('a project change is told as the fact it is (F5-68, M02-35)', () => {
  it.each<[string, string | undefined, string]>([
    ['install_date', undefined, 'Install date changed'],
    ['install_date', 'install_start', 'Install start time changed'],
    ['install_date', 'days_on_site', 'Days on site changed'],
    ['install_date', 'what_to_expect', 'What to expect changed'],
    ['crew', 'crew_lead', 'Crew lead changed'],
    ['crew', undefined, 'Crew picked'],
    // A fact a newer server names reads as its field.
    ['install_date', 'install_end', 'Install date changed'],
  ])('%s · %s → %s', async (field, fact, said) => {
    const { t } = await createTranslator('en');
    const entry = {
      kind: 'project_changed',
      body: { projectId: PROJECT, field, ...(fact === undefined ? {} : { fact }) },
    } as unknown as Parameters<typeof projectEntryWords>[2];
    expect(projectEntryWords(t, formats, entry).summary).toBe(said);
  });
});
