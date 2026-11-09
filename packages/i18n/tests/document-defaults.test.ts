/**
 * The platform's document defaults (`M01-28`, `M01-51`, `M01-52`, `M01-54`) in each reader's words,
 * against the real catalogs: a whole body of terms with no number in it, and the eight phases of
 * `M08-08`'s chain, each named and explained.
 */
import { UI_LANGUAGES } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { documentDefaults } from '../src/copy/document-defaults';
import { createTranslator } from '../src/runtime';

describe('the platform’s document defaults', () => {
  it.each(UI_LANGUAGES.map((language) => [language]))(
    'a %s reader gets four paragraphs of terms and eight named phases',
    async (language) => {
      const { t } = await createTranslator(language);
      const defaults = documentDefaults(t);

      expect(defaults.terms.blocks).toHaveLength(4);
      for (const block of defaults.terms.blocks) {
        expect(block.type).toBe('p');
        expect(JSON.stringify(block)).not.toMatch(/\d/);
      }
      expect(defaults.phases).toHaveLength(8);
      for (const phase of defaults.phases) {
        expect(phase.name.trim()).not.toBe('');
        expect(phase.description.trim()).not.toBe('');
      }
    },
  );
});
