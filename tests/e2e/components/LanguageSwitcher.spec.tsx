import {
  createTranslator,
  LANGUAGE_META,
  proposalTemplateWords,
  SETUP_LANGUAGE,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { HeldLanguageSwitcher } from './LanguageSwitcher.story';

/**
 * The language strip as `SCR-M01-19`'s editor parts draw it — `labelHidden`, `summary=""`, no
 * counts, functional — at the phone's 375: the label stops being drawn and goes on naming the
 * tablist, and no head row is left above the strip. And the kind of language the caller passes
 * (`languageNoun`) is the one the words name, in place of the voice agent's.
 */
const en = await createTranslator('en');

/* "Language", the word a language picker already shows; lowered, it is the noun a non-voice
   screen passes. */
const LABEL = en.t(SETUP_LANGUAGE.group);
const NOUN = LABEL.toLowerCase();
const PARTS = proposalTemplateWords(en.t).partsNoun;

const LANGUAGES = [
  { code: 'en', label: LANGUAGE_META.en.endonym, primary: true, state: 'authored' as const },
  { code: 'hi', label: LANGUAGE_META.hi.endonym, state: 'authored' as const },
  { code: 'mr', label: LANGUAGE_META.mr.endonym, state: 'empty' as const },
];

test('a hidden label still names the tablist', async ({ mount }) => {
  const strip = await mount(
    <div style={{ width: 375 }}>
      <HeldLanguageSwitcher
        languages={LANGUAGES}
        initial="en"
        label={LABEL}
        languageNoun={NOUN}
        sectionNoun={PARTS}
        labelHidden
        summary=""
        showCounts={false}
        density="functional"
      />
    </div>,
  );

  const tablist = strip.getByRole('tablist', { name: LABEL, exact: true });
  await expect(tablist).toBeVisible();
  await expect(tablist.getByRole('tab')).toHaveCount(LANGUAGES.length);
  await expect(strip.locator('.hg-language-switcher-overline')).toHaveCount(0);
  await expect(strip.getByText(LABEL, { exact: true })).toHaveCount(0);

  /* No head row at all: the strip is the first thing drawn, flush with the switcher's top. */
  await expect(strip.locator('.hg-language-switcher-head')).toHaveCount(0);
  const gap = await tablist.evaluate((element) => {
    const root = element.closest('.hg-language-switcher') as HTMLElement;
    return element.getBoundingClientRect().top - root.getBoundingClientRect().top;
  });
  expect(gap).toBe(0);
});

test('a hidden label with a summary keeps the summary and drops only the overline', async ({
  mount,
}) => {
  const SUMMARY = en.t(SETUP_LANGUAGE.askTitle);
  const strip = await mount(
    <HeldLanguageSwitcher
      languages={LANGUAGES}
      initial="en"
      label={LABEL}
      languageNoun={NOUN}
      sectionNoun={PARTS}
      labelHidden
      summary={SUMMARY}
      showCounts={false}
    />,
  );

  await expect(strip.locator('.hg-language-switcher-overline')).toHaveCount(0);
  await expect(strip.locator('.hg-language-switcher-summary')).toHaveText(SUMMARY);
  await expect(strip.getByRole('tablist', { name: LABEL, exact: true })).toBeVisible();
});

test('the language noun names each language', async ({ mount }) => {
  const strip = await mount(
    <HeldLanguageSwitcher
      languages={LANGUAGES}
      initial="en"
      label={LABEL}
      languageNoun={NOUN}
      sectionNoun={PARTS}
      showCounts={false}
    />,
  );

  /* The overline is the label the caller words, and names the tablist. */
  await expect(strip.locator('.hg-language-switcher-overline')).toHaveText(LABEL);
  await expect(strip.getByRole('tablist', { name: LABEL, exact: true })).toBeVisible();

  /* The summary counts in the plural noun. */
  await expect(strip.locator('.hg-language-switcher-summary')).toContainText(
    ` ${LANGUAGES.length} ${NOUN}s`,
  );

  /* The primary's accessible name and the selected sentence both name its kind with the noun. */
  const primary = strip.getByRole('tab', { name: new RegExp(`^${LANGUAGE_META.en.endonym},`) });
  await expect(primary).toHaveAttribute('aria-selected', 'true');
  await expect(primary).toHaveAccessibleName(
    new RegExp(`^${LANGUAGE_META.en.endonym}, primary ${NOUN}$`),
  );
  await expect(strip.locator('.hg-language-switcher-sentence')).toContainText(`primary ${NOUN}`);

  /* Choosing another language keeps every name on the noun. */
  await strip.getByRole('tab', { name: new RegExp(`^${LANGUAGE_META.hi.endonym},`) }).click();
  await expect(strip.getByRole('tab', { selected: true })).toHaveAccessibleName(
    new RegExp(`^${LANGUAGE_META.hi.endonym},`),
  );
  await expect(primary).toHaveAttribute('aria-selected', 'false');
  await expect(primary).toHaveAccessibleName(new RegExp(`primary ${NOUN}$`));
});
