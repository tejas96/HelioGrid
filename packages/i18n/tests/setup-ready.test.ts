import { beforeAll, describe, expect, it } from 'vitest';
import { setupReadyWords } from '../src/copy/setup-ready';
import { createTranslator } from '../src/runtime';

/** *You're ready*'s words (`SCR-M01-06`): the board's, word for word. */
let t: Awaited<ReturnType<typeof createTranslator>>['t'];
beforeAll(async () => {
  t = (await createTranslator('en')).t;
});

describe('setupReadyWords', () => {
  it('draws the board’s heading and two doors', () => {
    const words = setupReadyWords(t);
    expect(words.title).toBe('You’re ready');
    expect(words.lead).toEqual({
      title: 'Start with a real lead',
      line: 'A name and a phone number is enough to begin.',
      act: 'Create your first lead',
    });
    expect(words.demo.act).toBe('Open the demo project');
    expect(words.demo.failed).toBe('We couldn’t get the demo project ready');
    expect(words.wall).toEqual({
      title: 'We couldn’t open your workspace',
      line: 'Your company is set up.',
    });
  });

  it.each(['en', 'hi', 'mr'] as const)('names the company in the line, in %s', async (language) => {
    const words = setupReadyWords((await createTranslator(language)).t);
    expect(words.companyLine('Suryodaya Solar Solutions')).toContain('Suryodaya Solar Solutions');
  });

  it.each(['hi', 'mr'] as const)('every word has %s', async (language) => {
    const local = setupReadyWords((await createTranslator(language)).t);
    const english = setupReadyWords(t);
    const flat = (w: typeof english) => [
      w.title,
      w.companyLine('X'),
      ...Object.values(w.lead),
      w.demo.title,
      w.demo.badge,
      w.demo.line,
      w.demo.act,
      w.demo.loading,
      w.demo.failed,
      w.wall.title,
      w.wall.line,
      w.tryAgain,
    ];
    const pairs = flat(local).map((word, i) => [word, flat(english)[i]]);
    for (const [word, englishWord] of pairs) expect(word).not.toBe(englishWord);
  });
});
