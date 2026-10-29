import { createTranslator, richTextWords } from '@heliogrid/i18n';
import type { RichTextWords } from '@heliogrid/ui';

/**
 * `RichText`'s words as its spec and story both read them. ENGLISH is the editor's own words from
 * the catalog, in English; MARKED gives every word a marker no
 * English default could equal, so a word the editor did not take from its prop shows as itself.
 */
const en = await createTranslator('en');

export const RICH_TEXT_ENGLISH: RichTextWords = richTextWords(en.t);

/* The markers have no catalog message, so the translator hands each back as it is. */
export const RICH_TEXT_MARKED: RichTextWords = {
  formatting: en.t('«w-formatting»'),
  bold: en.t('«w-b»'),
  italic: en.t('«w-i»'),
  heading: en.t('«w-h»'),
  bulletedList: en.t('«w-ul»'),
  numberedList: en.t('«w-ol»'),
  link: en.t('«w-a»'),
  linkAddress: en.t('«w-href»'),
  addLink: en.t('«w-apply»'),
  addLogo: en.t('«w-logo-off»'),
  logoOn: en.t('«w-logo-on»'),
  addTheLogo: en.t('«w-logo-add»'),
  removeTheLogo: en.t('«w-logo-remove»'),
  logoPrintsHere: en.t('«w-logo-slot»'),
  loadTemplate: en.t('«w-load»'),
  loadSavedTemplate: en.t('«w-load-name»'),
  loadTemplateNamed: (name) => en.t(`«w-load:${name}»`),
  editorName: en.t('«w-editor»'),
  characters: (count, max) => en.t(`«w-count:${count}/${max ?? '-'}»`),
};
