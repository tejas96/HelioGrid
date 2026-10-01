import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { UI_LANGUAGES } from '@heliogrid/domain';

/**
 * Every language in the set renders, on every platform, in a face we ship.
 *
 *   1. every character its catalog and its endonym draw is covered by a family in the design
 *      system's sans stack — never a system fallback;
 *   2. every family in the stack ships a static phone face at every sanctioned weight, in the
 *      phone's font folder, both native bundles and the iOS font list — and Android resolves each
 *      family, the mono one too, BY NAME: its faces in `res/font`, its weights in the family's XML,
 *      the family registered in `MainApplication.kt`. Android looks a font up by file name, so a
 *      face present under any other name draws Roboto.
 *
 * It reads the BUILT i18n and theme packages — the compiled catalogs and the generated type
 * tokens — by path, since neither is a dependency of this package, so they must be built first:
 * `pnpm verify` builds before anything, and `pnpm check:all` builds through typecheck.
 * `turbo test` alone builds only this package's own dependencies, which do not include them.
 */
const BUILT = {
  i18n: 'packages/i18n/dist/index.js',
  theme: 'packages/theme/dist/theme.js',
};
const MOBILE = 'apps/mobile';
const PHONE_FONT_FOLDER = 'assets/fonts';
const ANDROID_FONTS = 'android/app/src/main/res/font';
const ANDROID_REGISTRY = 'android/app/src/main/java/com/heliogridmobile/MainApplication.kt';
const ANDROID_LINKED = 'android/app/src/main/assets/fonts';
const PHONE_FONT_LISTS = [
  'ios/HelioGridMobile/Info.plist',
  'ios/HelioGridMobile.xcodeproj/project.pbxproj',
];
/** The OpenType names a static instance is filed under, by `usWeightClass`. */
const STATIC_WEIGHT_NAME: ReadonlyMap<number, string> = new Map([
  [100, 'Thin'],
  [200, 'ExtraLight'],
  [300, 'Light'],
  [400, 'Regular'],
  [500, 'Medium'],
  [600, 'SemiBold'],
  [700, 'Bold'],
  [800, 'ExtraBold'],
  [900, 'Black'],
]);

interface Face {
  readonly family: string;
  readonly ranges: readonly (readonly [number, number])[];
}

type Loose = Record<string, unknown>;
const isLoose = (value: unknown): value is Loose => typeof value === 'object' && value !== null;

const isString = (value: unknown): value is string => typeof value === 'string';
const isFaceList = (value: unknown): value is readonly Face[] =>
  Array.isArray(value) &&
  value.every((face) => isLoose(face) && isString(face.family) && Array.isArray(face.ranges));
const isCatalogLoader = (value: unknown): value is (code: string) => Promise<unknown> =>
  typeof value === 'function';

/** `path` read off a built module and checked for its shape, or a refusal naming what to rebuild. */
function built<T>(
  module: unknown,
  path: readonly string[],
  from: string,
  is: (v: unknown) => v is T,
): T {
  let value: unknown = module;
  for (const key of path) value = isLoose(value) ? value[key] : undefined;
  if (!is(value)) {
    throw new Error(
      `language-fonts: ${from} has no ${path.join('.')} of the shape this reads — build the ` +
        'packages first (`pnpm turbo build`), or the shape it reads has changed',
    );
  }
  return value;
}

async function importBuilt(repo: string, file: string): Promise<unknown> {
  if (!existsSync(join(repo, file))) {
    throw new Error(`language-fonts: ${file} is not built — run \`pnpm turbo build\` first`);
  }
  return import(pathToFileURL(join(repo, file)).href);
}

/** Every literal string in a compiled Lingui message, plural and select branches included. */
function textsOf(message: unknown): string[] {
  if (typeof message === 'string') return [message];
  if (!Array.isArray(message)) return [];
  return message.flatMap((part: unknown) => {
    if (typeof part === 'string') return [part];
    if (!Array.isArray(part) || part.length !== 3 || !isLoose(part[2])) return [];
    return Object.values(part[2]).flatMap(textsOf);
  });
}

async function uncoveredCharacters(
  repo: string,
  stack: readonly Face[],
): Promise<{ findings: string[]; characters: number }> {
  const i18n = await importBuilt(repo, BUILT.i18n);
  const loadCatalog = built(i18n, ['loadCatalog'], BUILT.i18n, isCatalogLoader);
  const drawn = (codePoint: number) =>
    stack.some((face) => face.ranges.some(([low, high]) => codePoint >= low && codePoint <= high));
  const findings: string[] = [];
  let characters = 0;
  for (const language of UI_LANGUAGES) {
    const endonym = built(i18n, ['LANGUAGE_META', language, 'endonym'], BUILT.i18n, isString);
    const catalog = await loadCatalog(language);
    if (!isLoose(catalog) || Object.keys(catalog).length === 0) {
      throw new Error(
        `language-fonts: the ${language} catalog holds no message — nothing to cover`,
      );
    }
    const texts = [endonym, ...Object.values(catalog).flatMap(textsOf)];
    const uncovered = new Map<number, string>();
    for (const character of texts.join('')) {
      characters += 1;
      const codePoint = character.codePointAt(0) ?? 0;
      if (!drawn(codePoint)) uncovered.set(codePoint, character);
    }
    for (const [codePoint, character] of uncovered) {
      const hex = codePoint.toString(16).toUpperCase().padStart(4, '0');
      findings.push(`${language}: U+${hex} "${character}" is drawn by no bundled face`);
    }
  }
  return { findings, characters };
}

const mobile = (repo: string, file: string) => join(repo, MOBILE, file);
const readMobile = (repo: string, file: string) =>
  existsSync(mobile(repo, file)) ? readFileSync(mobile(repo, file), 'utf8') : '';
const withoutComments = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '');

function iosFaceGaps(repo: string, stack: readonly Face[], weights: readonly number[]): string[] {
  const lists = PHONE_FONT_LISTS.map((list) => ({ list, text: readMobile(repo, list) }));
  return stack.flatMap(({ family }) =>
    weights.flatMap((weight) => {
      const file = `${family.replaceAll(' ', '')}-${STATIC_WEIGHT_NAME.get(weight)}.ttf`;
      return [
        ...(existsSync(mobile(repo, join(PHONE_FONT_FOLDER, file)))
          ? []
          : [`phone: ${MOBILE}/${PHONE_FONT_FOLDER}/${file} is missing`]),
        ...lists
          .filter(({ text }) => !text.includes(file))
          .map(({ list }) => `phone: ${MOBILE}/${list} does not name ${file}`),
      ];
    }),
  );
}

/** A family registered after React Native loads, or in a comment, registers nothing. */
function androidFaceGaps(
  repo: string,
  families: readonly string[],
  weights: readonly number[],
): string[] {
  const onCreate = withoutComments(readMobile(repo, ANDROID_REGISTRY));
  const from = onCreate.indexOf('override fun onCreate()');
  const to = onCreate.indexOf('loadReactNative(this)');
  const registry = from === -1 || to === -1 ? '' : onCreate.slice(from, to);
  return families.flatMap((family) => {
    const name = family.replaceAll(' ', '').toLowerCase();
    const xml = withoutComments(readMobile(repo, join(ANDROID_FONTS, `${name}.xml`)));
    const registered = registry.includes(`addCustomFont(this, "${family}", R.font.${name})`);
    return [
      ...(registered
        ? []
        : [
            `android: ${MOBILE}/${ANDROID_REGISTRY} does not register "${family}" as R.font.${name}`,
          ]),
      ...weights.flatMap((weight) => {
        const face = `${name}_${(STATIC_WEIGHT_NAME.get(weight) ?? '').toLowerCase()}`;
        return [
          ...(existsSync(mobile(repo, join(ANDROID_FONTS, `${face}.ttf`)))
            ? []
            : [`android: ${MOBILE}/${ANDROID_FONTS}/${face}.ttf is missing`]),
          ...(xml.includes(`app:fontWeight="${weight}" app:font="@font/${face}"`)
            ? []
            : [
                `android: ${MOBILE}/${ANDROID_FONTS}/${name}.xml does not map weight ${weight} to @font/${face}`,
              ]),
        ];
      }),
    ];
  });
}

async function scanLanguageFonts(repo: string): Promise<{ findings: string[]; summary: string }> {
  const theme = await importBuilt(repo, BUILT.theme);
  const stack = built(theme, ['theme', 'type', 'scriptStack'], BUILT.theme, isFaceList);
  const weightTokens = built(theme, ['theme', 'type', 'weights'], BUILT.theme, isLoose);
  const mono = built(theme, ['theme', 'type', 'families', 'mono'], BUILT.theme, isString);
  const sanctioned = Object.values(weightTokens).filter((w): w is number => typeof w === 'number');
  if (stack.length === 0 || sanctioned.length === 0) {
    throw new Error(
      `language-fonts: ${BUILT.theme} carries ${stack.length} faces and ${sanctioned.length} ` +
        'weights — with nothing to cover, every check below would pass having read nothing',
    );
  }
  const named = sanctioned.filter((weight) => STATIC_WEIGHT_NAME.has(weight));
  const families = [...new Set([...stack.map(({ family }) => family), mono])];
  const linked = mobile(repo, ANDROID_LINKED);
  const catalogs = await uncoveredCharacters(repo, stack);
  const findings = [
    ...catalogs.findings,
    ...sanctioned
      .filter((weight) => !STATIC_WEIGHT_NAME.has(weight))
      .map(
        (weight) =>
          `phone: weight ${weight} has no static-instance name — add it to STATIC_WEIGHT_NAME`,
      ),
    ...iosFaceGaps(repo, stack, named),
    ...androidFaceGaps(repo, families, named),
    ...(existsSync(linked) && readdirSync(linked).length > 0
      ? [`android: ${MOBILE}/${ANDROID_LINKED} holds faces — move them to ${ANDROID_FONTS}`]
      : []),
  ];
  const summary =
    `${catalogs.characters} characters in ${UI_LANGUAGES.length} catalogs drawn by the sans ` +
    `stack; ${stack.length} faces × ${sanctioned.length} weights on the phone`;
  return { findings, summary };
}

export async function findLanguageFontGaps(repo: string): Promise<string[]> {
  return (await scanLanguageFonts(repo)).findings;
}

export async function runLanguageFonts(repo: string): Promise<void> {
  const { findings, summary } = await scanLanguageFonts(repo);
  if (findings.length > 0) {
    throw new Error(
      'language-fonts: a language that fails is never offered:\n  ' +
        findings.join('\n  ') +
        '\n  The playbook is packages/i18n/CLAUDE.md, "Adding a language".',
    );
  }
  console.log(`language-fonts OK — ${summary}`);
}
