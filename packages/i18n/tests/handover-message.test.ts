import { beforeAll, describe, expect, it } from 'vitest';
import { handoverMessage } from '../src/copy/project-handover';
import { createTranslator } from '../src/runtime';

/** The message a person sends at handover (`M08-46`): it never names an empty list of documents. */

let en: Awaited<ReturnType<typeof createTranslator>>['t'];

beforeAll(async () => {
  ({ t: en } = await createTranslator('en'));
});

describe('handoverMessage', () => {
  it.each([
    [
      'Meera',
      'Warranty documents',
      'Hello Meera! Your solar system is now handed over to you. Your documents: Warranty documents. Thank you for choosing us. — Suryodaya Solar',
    ],
    [
      null,
      'Warranty documents',
      'Hello! Your solar system is now handed over to you. Your documents: Warranty documents. Thank you for choosing us. — Suryodaya Solar',
    ],
    [
      'Meera',
      '',
      'Hello Meera! Your solar system is now handed over to you. Thank you for choosing us. — Suryodaya Solar',
    ],
    [
      null,
      '  ',
      'Hello! Your solar system is now handed over to you. Thank you for choosing us. — Suryodaya Solar',
    ],
  ] as const)('to %s with documents “%s”', (customer, documents, said) => {
    expect(handoverMessage(en, { customer, documents, company: 'Suryodaya Solar' })).toBe(said);
  });
});
