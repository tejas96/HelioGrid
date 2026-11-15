import { describe, expect, it } from 'vitest';
import { fillWantsLine } from '../src/copy/proposal-builder-performance';
import { createTranslator } from '../src/runtime';

/**
 * Step 4 says exactly why it is not filled (`M06-10`): the size, the site's state, or both — and,
 * with both given, that the place asked about holds no estimate when the server refused the fill.
 */
describe('fillWantsLine', () => {
  const where = { source: 'PVGIS', place: 'Dimapur' };
  it.each([
    [
      { size: true, state: true, refused: false },
      'Set the size in System and the site’s state in Client first.',
    ],
    [{ size: true, state: false, refused: false }, 'Set the size in System first.'],
    [{ size: false, state: true, refused: false }, 'Set the site’s state in Client first.'],
    [{ size: false, state: true, refused: true }, 'Set the site’s state in Client first.'],
    [
      { size: false, state: false, refused: true },
      'No estimate is held for Dimapur. Pick another place in Client.',
    ],
    [{ size: false, state: false, refused: false }, 'Ask PVGIS for Dimapur.'],
  ])('%o reads %s', async (wants, line) => {
    const { t } = await createTranslator('en');
    expect(fillWantsLine(t, wants, where)).toBe(line);
  });
});
