#!/usr/bin/env node
/**
 * The language readiness gate (`F3-27`) — a language in the set ships only once it cannot render
 * broken. Four facts per language, each decided completely:
 *
 *   1. every character its catalog and its endonym draw is covered by a family in the design
 *      system's sans stack — never a system fallback (`F3-13`); the weights are `M133`'s, which
 *      refuses to emit a face that would synthesize one (`F3-14`);
 *   2. the runtime has its plural rules (this is the web half; the phone's polyfill line is
 *      `check:adherence` 9);
 *   3. every plural message written in the language carries every category its rules name — a
 *      message still in English is a translation gap, which the gate does not judge (`F3-05`);
 *   4. every family in the stack ships a static phone face at every sanctioned weight, in the
 *      phone's font folder, both native bundles and the iOS font list.
 *
 * It reads the BUILT packages, so a build runs first (`check:all` builds through typecheck,
 * `verify` builds before anything). What it cannot decide — whether a dense screen survives the
 * language's length — is the reviewer's step in the playbook (`packages/i18n/CLAUDE.md`).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (path) => import(pathToFileURL(join(root, path)).href);

const { UI_LANGUAGES, UI_SOURCE_LOCALE } = await load('packages/domain/dist/index.js');
const { LANGUAGE_META, loadCatalog } = await load('packages/i18n/dist/index.js');
const { theme } = await load('packages/theme/dist/theme.js');

const MOBILE = join(root, 'apps/mobile');
const PHONE_FONT_FOLDERS = ['assets/fonts', 'android/app/src/main/assets/fonts'];
const PHONE_FONT_LISTS = [
  'ios/HelioGridMobile/Info.plist',
  'ios/HelioGridMobile.xcodeproj/project.pbxproj',
];
/** The OpenType names a static instance is filed under, by `usWeightClass`. */
const STATIC_WEIGHT_NAME = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};

const stack = theme.type.scriptStack;
const sanctioned = Object.values(theme.type.weights);
const failures = [];

const drawnByStack = (codePoint) =>
  stack.some((face) => face.ranges.some(([low, high]) => codePoint >= low && codePoint <= high));

/**
 * A compiled Lingui message: a string, or a list of literal strings, `[name]` placeholders and
 * `[name, 'plural' | 'selectordinal' | 'select', cases]` nodes whose cases are messages again.
 */
function visit(message, onText, onPlural) {
  if (typeof message === 'string') return onText(message);
  for (const part of message) {
    if (typeof part === 'string') onText(part);
    else if (part.length === 3) {
      const [, kind, cases] = part;
      if (kind === 'plural' || kind === 'selectordinal') onPlural(kind, cases);
      for (const branch of Object.values(cases)) visit(branch, onText, onPlural);
    }
  }
}

const sourceCatalog = await loadCatalog(UI_SOURCE_LOCALE);
const report = [];

for (const language of UI_LANGUAGES) {
  const catalog = await loadCatalog(language);
  const uncovered = new Map();
  let characters = 0;
  let plurals = 0;

  const checkText = (text) => {
    for (const character of text) {
      characters += 1;
      const codePoint = character.codePointAt(0);
      if (!drawnByStack(codePoint)) {
        uncovered.set(codePoint, character);
      }
    }
  };

  checkText(LANGUAGE_META[language].endonym);

  if (Intl.PluralRules.supportedLocalesOf([language]).length === 0) {
    failures.push(`${language}: this runtime has no plural rules for it`);
  }

  for (const [id, message] of Object.entries(catalog)) {
    const inTheLanguage =
      language === UI_SOURCE_LOCALE ||
      JSON.stringify(message) !== JSON.stringify(sourceCatalog[id]);
    visit(message, checkText, (kind, cases) => {
      if (!inTheLanguage) return;
      plurals += 1;
      const type = kind === 'selectordinal' ? 'ordinal' : 'cardinal';
      const needed = new Intl.PluralRules(language, { type }).resolvedOptions().pluralCategories;
      const missing = needed.filter((category) => !(category in cases));
      if (missing.length > 0) {
        failures.push(`${language}: "${id}" has no ${missing.join(', ')} form`);
      }
    });
  }

  for (const [codePoint, character] of uncovered) {
    const hex = codePoint.toString(16).toUpperCase().padStart(4, '0');
    failures.push(`${language}: U+${hex} "${character}" is drawn by no bundled face`);
  }
  report.push(`${language} (${characters} characters, ${plurals} plural messages)`);
}

for (const weight of sanctioned.filter((weight) => !(weight in STATIC_WEIGHT_NAME))) {
  failures.push(
    `phone: weight ${weight} has no static-instance name here — add it to STATIC_WEIGHT_NAME`,
  );
}
for (const { family } of stack) {
  for (const weight of sanctioned.filter((weight) => weight in STATIC_WEIGHT_NAME)) {
    const file = `${family.replaceAll(' ', '')}-${STATIC_WEIGHT_NAME[weight]}.ttf`;
    for (const folder of PHONE_FONT_FOLDERS) {
      if (!existsSync(join(MOBILE, folder, file))) {
        failures.push(`phone: ${folder}/${file} is missing`);
      }
    }
    for (const list of PHONE_FONT_LISTS) {
      if (!readFileSync(join(MOBILE, list), 'utf8').includes(file)) {
        failures.push(`phone: ${list} does not name ${file}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.log('language readiness FAILED — a language that fails is never offered (F3-27):');
  for (const failure of failures) console.log(`  ${failure}`);
  console.log('The playbook is packages/i18n/CLAUDE.md, "Adding a language".');
  process.exit(1);
}
console.log(
  `language readiness OK — ${report.join(' · ')}; ` +
    `${stack.length} faces × ${sanctioned.length} weights on the phone`,
);
