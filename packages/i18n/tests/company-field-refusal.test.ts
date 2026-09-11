import { describe, expect, it } from 'vitest';
import { companyFieldRefusal } from '../src/copy/company-signup';
import { createTranslator } from '../src/runtime';

/**
 * The one rule both platforms' company fields draw (`SCR-M01-02`, the fields-invalid state): an
 * empty detail is answered with why it is needed, in the reader's language; a refusal that
 * carries the wire's words keeps them; a field with no refusal says nothing.
 */
describe('companyFieldRefusal', () => {
  it('an empty detail says why it is needed, in the reader’s language', async () => {
    const { t } = await createTranslator('hi');
    const said = companyFieldRefusal(t, 'companyName', { type: 'too_small', message: 'x' });
    expect(said).toBeDefined();
    expect(said).not.toBe('x');
    expect(said).not.toMatch(/company name is needed/);
  });

  it('a refusal that is not about emptiness keeps the words it came with', async () => {
    const { t } = await createTranslator('en');
    expect(
      companyFieldRefusal(t, 'city', { type: 'custom', message: 'That city is closed.' }),
    ).toBe('That city is closed.');
  });

  it('a field with no refusal says nothing', async () => {
    const { t } = await createTranslator('en');
    expect(companyFieldRefusal(t, 'ownerName', undefined)).toBeUndefined();
  });
});
