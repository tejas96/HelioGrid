import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { newlinesOf, walkFiles } from './repo-files';

/**
 * The commercial document is a Proposal, in every language — in the files no lint plugin parses.
 *
 * "quote" and "quotation" are banned in every form: a check cannot tell the noun from the verb,
 * and "quoted" on a document still calls it a quote. No word boundary: the word inside
 * `quoteTotal` is the same word, while `quota` is a different word and passes. The Devanagari
 * spellings are the same two words transliterated. The source trees, the scripts and the JSON are
 * the lint plugins'; this reads the rest of the same places: the .po catalogs, the hand-written
 * SQL (it names functions, policies and views), and the XML, plist and HTML that name the app to
 * a person. A comment is not an interface string, so each is blanked TO ITS OWN NEWLINES — deleting
 * it would shift every later line and the finding would name the wrong one. A SQL string literal
 * is read, never blanked, and a `--` inside one starts no comment.
 */
const BANNED_WORD = /quot(e|ation|ing)|कोटेश|क्वोट|क्वॉट/i;
const SKIPPED_FOLDERS: ReadonlySet<string> = new Set([
  '_generated',
  'node_modules',
  'dist',
  '.next',
]);
const WORD_DIRS = [
  'apps/api/src',
  'apps/worker/src',
  'apps/mobile/src',
  'apps/mobile/App.tsx',
  'apps/web/app',
  'apps/web/features',
  'apps/web/lib',
  'packages/db/migrations',
];
const WORD_FILES = [
  'apps/mobile/app.json',
  'apps/mobile/ios/HelioGridMobile/Info.plist',
  'apps/mobile/android/app/src/main/res/values/strings.xml',
  'apps/web/next.config.ts',
];

const blankComments: Record<string, (text: string) => string> = {
  '.po': (text) => text.replace(/^#[^\n]*/gm, ''),
  '.sql': (text) =>
    text.replace(/('(?:''|[^'])*')|(--[^\n]*|\/\*[\s\S]*?\*\/)/g, (match, literal?: string) =>
      literal === undefined ? newlinesOf(match) : literal,
    ),
  '.xml': (text) => text.replace(/<!--[\s\S]*?-->/g, newlinesOf),
  '.plist': (text) => text.replace(/<!--[\s\S]*?-->/g, newlinesOf),
  '.html': (text) => text.replace(/<!--[\s\S]*?-->/g, newlinesOf),
};

/** Every package's `src`, found rather than listed, so a new package is read the day it lands. */
function packageSources(repo: string): string[] {
  const packages = join(repo, 'packages');
  if (!existsSync(packages)) return [];
  return readdirSync(packages)
    .sort()
    .map((name) => `packages/${name}/src`)
    .filter((folder) => existsSync(join(repo, folder)));
}

function scanBannedWord(repo: string): { findings: string[]; files: number } {
  const places = [...WORD_DIRS, ...packageSources(repo), ...WORD_FILES];
  const missing = places.filter((place) => !existsSync(join(repo, place)));
  const files = [...new Set(places.flatMap((place) => walkFiles(repo, place, SKIPPED_FOLDERS)))]
    .filter((file) => Object.hasOwn(blankComments, extname(file)))
    .sort();
  if (files.length === 0) {
    throw new Error(
      'banned-word-other-files: read NO .po, .sql, .xml, .plist or .html file — the places it ' +
        'reads moved, and a scan of nothing reports a pass it never earned',
    );
  }
  const findings = files.flatMap((file) => {
    const blank = blankComments[extname(file)] ?? ((text: string) => text);
    return blank(readFileSync(join(repo, file), 'utf8'))
      .split('\n')
      .flatMap((line, index) =>
        BANNED_WORD.test(line) ? [`${file}:${index + 1}: ${line.trim().slice(0, 120)}`] : [],
      );
  });
  return {
    findings: [...missing.map((place) => `${place}: named here but does not exist`), ...findings],
    files: files.length,
  };
}

export function findBannedWordInOtherFiles(repo: string): string[] {
  return scanBannedWord(repo).findings;
}

export function runBannedWordOtherFiles(repo: string): void {
  const { findings, files } = scanBannedWord(repo);
  if (findings.length > 0) {
    throw new Error(
      'banned-word-other-files: the commercial document is a Proposal, in every language:\n  ' +
        findings.join('\n  ') +
        '\n  Say "proposal" (प्रस्ताव). The words are allowed only as the search query alias.',
    );
  }
  console.log(
    `banned-word-other-files OK — ${files} catalog, SQL and markup files, no "quote" in any language`,
  );
}
