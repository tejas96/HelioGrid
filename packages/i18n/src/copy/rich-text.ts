/**
 * The `RichText` editor's own words (`packages/ui`'s `RichTextWords`): its toolbar's names, the
 * logo toggle, the template picker, the link field and the character count — authored once for
 * every screen that edits rich text, in three languages (`F3-07`).
 */
import type { Translator } from '../runtime';

const RICH_TEXT = {
  formatting: /*i18n*/ { id: 'Formatting' },
  bold: /*i18n*/ { id: 'Bold' },
  italic: /*i18n*/ { id: 'Italic' },
  heading: /*i18n*/ { id: 'Heading' },
  bulletedList: /*i18n*/ { id: 'Bulleted list' },
  numberedList: /*i18n*/ { id: 'Numbered list' },
  link: /*i18n*/ { id: 'Link' },
  linkAddress: /*i18n*/ { id: 'Link address' },
  addLink: /*i18n*/ { id: 'Add link' },
  addLogo: /*i18n*/ { id: 'Add logo' },
  logoOn: /*i18n*/ { id: 'Logo on' },
  addTheLogo: /*i18n*/ { id: 'Add the logo' },
  removeTheLogo: /*i18n*/ { id: 'Remove the logo' },
  logoPrintsHere: /*i18n*/ { id: 'Logo prints here' },
  loadTemplate: /*i18n*/ { id: 'Load template…' },
  loadSavedTemplate: /*i18n*/ { id: 'Load a saved template' },
  loadTemplateNamed: /*i18n*/ { id: 'Load template: {name}' },
  editorName: /*i18n*/ { id: 'Terms and conditions' },
  characters: /*i18n*/ { id: '{count, plural, one {# character} other {# characters}}' },
  charactersOf: /*i18n*/ { id: '{count}/{max} characters' },
} as const;

/** Every word `RichText` draws or speaks, in the reader's language. */
export function richTextWords(t: Translator['t']) {
  return {
    formatting: t(RICH_TEXT.formatting),
    bold: t(RICH_TEXT.bold),
    italic: t(RICH_TEXT.italic),
    heading: t(RICH_TEXT.heading),
    bulletedList: t(RICH_TEXT.bulletedList),
    numberedList: t(RICH_TEXT.numberedList),
    link: t(RICH_TEXT.link),
    linkAddress: t(RICH_TEXT.linkAddress),
    addLink: t(RICH_TEXT.addLink),
    addLogo: t(RICH_TEXT.addLogo),
    logoOn: t(RICH_TEXT.logoOn),
    addTheLogo: t(RICH_TEXT.addTheLogo),
    removeTheLogo: t(RICH_TEXT.removeTheLogo),
    logoPrintsHere: t(RICH_TEXT.logoPrintsHere),
    loadTemplate: t(RICH_TEXT.loadTemplate),
    loadSavedTemplate: t(RICH_TEXT.loadSavedTemplate),
    loadTemplateNamed: (name: string) => t(RICH_TEXT.loadTemplateNamed, { name }),
    editorName: t(RICH_TEXT.editorName),
    characters: (count: number, max?: number) =>
      max === undefined
        ? t(RICH_TEXT.characters, { count })
        : t(RICH_TEXT.charactersOf, { count, max }),
  };
}
