import type { TranslatedText } from '@heliogrid/contracts';
import { describe, expect, it } from 'vitest';
import { createTranslator } from '../src/runtime';

/**
 * `F3-07`: everything the product says is translated content. `TranslatedText` is the only type a
 * `packages/ui` copy prop takes, and `packages/i18n` is the only package that hands one out. The
 * runtime half reads real catalogs; the type half is the lines marked `@ts-expect-error`, which
 * this package's typecheck compiles: if a raw string were ever accepted as words, the marker would
 * have nothing to expect and the typecheck would fail.
 */

/** A message every catalog holds (packages/i18n/src/copy/validation.ts). */
const HELD = 'This field is required.';
const HELD_IN_HINDI = 'यह फ़ील्ड ज़रूरी है।';

/** A component's copy prop, as a `packages/ui` `.types.ts` declares one. */
interface CopyProps {
  readonly label: TranslatedText;
}

describe('TranslatedText — words reach a component only through the catalog (F3-07)', () => {
  it("a translator hands back its catalog's words as TranslatedText, and a literal, a template literal and an English default are refused", async () => {
    const reader = await createTranslator('hi');
    const words: TranslatedText = reader.t(HELD);
    const props: CopyProps = { label: words };
    expect(props.label).toBe(HELD_IN_HINDI);

    const count = 3;
    // @ts-expect-error a literal is English, not translated words
    const literal: CopyProps = { label: 'Sort' };
    // @ts-expect-error a template literal is English, not translated words
    const template: CopyProps = { label: `Step ${count}` };
    // @ts-expect-error an English default is English, not translated words
    const withDefault = ({ label = 'Sort' }: Partial<CopyProps>) => label;
    expect([literal.label, template.label, withDefault({})]).toEqual(['Sort', 'Step 3', 'Sort']);
  });
});
