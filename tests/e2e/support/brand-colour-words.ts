import { brandColourFieldWords, createTranslator } from '@heliogrid/i18n';

/** The field's words in English from the real catalog, as the spec and its story both read them. */
export const BRAND_COLOUR_WORDS = brandColourFieldWords((await createTranslator('en')).t);
