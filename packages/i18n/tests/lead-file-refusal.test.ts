import { describe, expect, it } from 'vitest';
import { leadSectionsWords } from '../src/copy/lead-detail-parts';
import { createTranslator } from '../src/runtime';

/** A refused pick says what a lead takes, read from the lead's file rule, never typed twice. */
describe('a refused lead file', () => {
  it.each([
    ['too-large', 'roof.pdf is too large. A lead takes files up to 2 MB.'],
    ['type-not-taken', 'setup.exe can’t be added. A lead takes PNG, JPG, PDF files.'],
  ] as const)('%s', async (why, line) => {
    const { t } = await createTranslator('en');
    const name = why === 'too-large' ? 'roof.pdf' : 'setup.exe';
    expect(leadSectionsWords(t).fileRefused[why](name)).toBe(line);
  });
});
