import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MESSAGE_TEMPLATE_KEYS } from '@heliogrid/domain';
import { REPO_ROOT } from './repo-root';

/**
 * F6-26: the message-template key list is EXHAUSTIVE (owner ruling) — "seeding a key anywhere …
 * is not complete until the key is added here". This invariant reads that row and holds
 * `MESSAGE_TEMPLATE_KEYS` equal to it both ways, so a key in code the PRD does not name, or a key
 * the PRD names that code lacks, is red here before any flow composes it.
 *
 * Static, and in this package because the book is outside every package.
 */
const PRD_PATH = join(REPO_ROOT, 'docs/prd/foundations/F6-notifications-and-search.md');
const LIST_OPENS = 'templates per key —';
const LIST_CLOSES = '**This list is exhaustive';
/** A key is snake case; the row's other backticked words (`F5-14`, `foundations/F5`) are not. */
const KEY = /`([a-z]+(?:_[a-z]+)*)`/g;

export function runTemplateKeysMirrorF6(): void {
  const row = readFileSync(PRD_PATH, 'utf8')
    .split('\n')
    .find((line) => line.startsWith('| F6-26 |'));
  const opens = row?.indexOf(LIST_OPENS) ?? -1;
  const closes = row?.indexOf(LIST_CLOSES) ?? -1;
  if (row === undefined || opens < 0 || closes < opens) {
    throw new Error(
      `template-keys-mirror-f6: no F6-26 key list found in ${PRD_PATH} — a vacuous pass is worse than none`,
    );
  }
  const prdKeys = [...row.slice(opens, closes).matchAll(KEY)].flatMap(([, key]) =>
    key === undefined ? [] : [key],
  );
  const code = new Set<string>(MESSAGE_TEMPLATE_KEYS);
  const prd = new Set(prdKeys);
  const problems = [
    ...prdKeys
      .filter((key) => !code.has(key))
      .map((key) => `${key}: named by F6-26, missing in code`),
    ...MESSAGE_TEMPLATE_KEYS.filter((key) => !prd.has(key)).map(
      (key) => `${key}: in code, but F6-26 does not name it`,
    ),
  ];
  if (problems.length > 0) {
    throw new Error(
      `template-keys-mirror-f6: ${problems.length} problem(s) against F6-26:\n  - ${problems.join('\n  - ')}\n\n  The list is exhaustive: add the key to F6-26 with its ruling, or remove it from code.`,
    );
  }
  console.log(`template keys mirror F6-26 — ${prd.size} keys, equal both ways`);
}
