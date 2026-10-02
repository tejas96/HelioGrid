import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFiles, lineAt } from './repo-files';

/**
 * A vocabulary is declared once — a package never copies a list its owner declares.
 *
 * Apps are held to their owners by the app-vocabulary plugin. A package is free to declare its own
 * vocabulary (a component's `size: 'sm' | 'md'` is packages/ui's to own), so what it may never do
 * is COPY a list contracts or domain already declares: the copy drifts the day the owner changes.
 * So this compares SETS — every string-literal list of three or more members the owners declare (a
 * `z.enum([...])`, an `as const` tuple, a union type) against every literal list any other file
 * declares, exported or not. Three or more, because a pair (`'add' | 'deduct'`) is too often two
 * unrelated concepts sharing words. Tests and generated trees are outside it, and a restatement
 * written as an `===` chain rather than a list is not seen.
 */
const OWNER_ROOTS = ['packages/contracts/src/', 'packages/domain/src/'];
const SMALLEST_VOCABULARY = 3;
const LIST = /\[\s*((?:'[^']+'\s*,\s*)+'[^']+'\s*,?)\s*\]/g;
const UNION = /^[ \t]*(?:export[ \t]+)?type[ \t]+\w+\s*=\s*((?:'[^']+'\s*\|\s*)+'[^']+')/gm;
const MEMBER = /'([^']+)'/g;

interface LiteralList {
  readonly key: string;
  readonly members: readonly string[];
  readonly line: number;
}

function scannedFiles(repo: string): string[] {
  return gitFiles(repo, ['apps', 'packages']).filter(
    (file) =>
      /\.tsx?$/.test(file) &&
      !file.endsWith('.d.ts') &&
      !['/tests/', '/_generated/', '/dist/', '/node_modules/'].some((part) => file.includes(part)),
  );
}

/** Each literal list in `text`, keyed by its member SET so order and repeats never hide a copy. */
function literalLists(text: string): LiteralList[] {
  return [LIST, UNION].flatMap((pattern) =>
    [...text.matchAll(pattern)].map((match) => {
      const members = [...new Set([...(match[1] ?? '').matchAll(MEMBER)].map((m) => m[1] ?? ''))];
      members.sort();
      return { key: JSON.stringify(members), members, line: lineAt(text, match.index) };
    }),
  );
}

/** The copies found, refusing a scan that read no owner list — that would pass having compared nothing. */
function scanVocabularyCopies(repo: string): { findings: string[]; ownedLists: number } {
  const files = scannedFiles(repo);
  const isOwner = (file: string) => OWNER_ROOTS.some((root) => file.startsWith(root));
  const owned = new Map<string, string>();
  for (const file of files.filter(isOwner)) {
    for (const list of literalLists(readFileSync(join(repo, file), 'utf8'))) {
      if (list.members.length >= SMALLEST_VOCABULARY && !owned.has(list.key)) {
        owned.set(list.key, `${file}:${list.line}`);
      }
    }
  }
  if (owned.size === 0) {
    throw new Error(
      `vocabulary-copies: read NO literal list of ${SMALLEST_VOCABULARY}+ members under ` +
        `${OWNER_ROOTS.join(' or ')} — the owners moved or the list shape changed, and a scan ` +
        'with nothing to compare reports a pass it never earned',
    );
  }
  const findings = files
    .filter((file) => !isOwner(file))
    .flatMap((file) =>
      literalLists(readFileSync(join(repo, file), 'utf8')).flatMap((list) => {
        const owner = owned.get(list.key);
        return list.members.length >= SMALLEST_VOCABULARY && owner !== undefined
          ? [`${file}:${list.line}: copies ${owner} (${list.members.join(', ')})`]
          : [];
      }),
    );
  return { findings, ownedLists: owned.size };
}

export function findVocabularyCopies(repo: string): string[] {
  return scanVocabularyCopies(repo).findings;
}

export function runVocabularyCopies(repo: string): void {
  const { findings, ownedLists } = scanVocabularyCopies(repo);
  if (findings.length > 0) {
    throw new Error(
      'vocabulary-copies: a vocabulary is declared twice, and the second copy drifts the day the ' +
        `owner changes:\n  ${findings.join('\n  ')}\n  Import the owner's type or tuple ` +
        '(contracts for a wire enum, domain for a policy list); never restate its members.',
    );
  }
  console.log(`vocabulary-copies OK — ${ownedLists} owner lists, none copied by another file`);
}
