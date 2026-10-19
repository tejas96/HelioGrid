import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CAPABILITY_MATRIX, VISIBILITY_MATRIX } from '@heliogrid/domain';
import { prdFiles } from './prd-rows';
import { gitFiles } from './repo-files';
import { BRIEFS } from './screens-register';
import { TASKS } from './task-ledger';

/**
 * Every capability a task or a brief cites is one the matrix holds, in either of its two names:
 * the id, `<area>.<name>` by the area that owns it (`onboarding.manage_team`), or the PRD's row key
 * (`F2.M01.manage-team`, or a visibility scope's, `F2.M02.lead-visibility`). A cited
 * `m01.manage_team` reads like an id, is copied into guards and tests, and exists nowhere. So a
 * backticked `<area>.<name>` is wrong when its area is a module code (`m01.`, `ms.`, `f2.`), when
 * its area is a capability area but the id is not held, or when its name is a capability's but
 * filed under another area. A file name (`onboarding.ts`) is not read, nor any `<area>.<name>` the
 * PRD itself writes in backticks — the studio's analytics events (`studio.step_viewed`). Column
 * names are not read either: their prefix is no area (`invitation.sent_at`).
 */
const CITED = /`([a-z][a-z0-9_]*)\.([a-z][a-z0-9_]*)`/g;
const ROW_KEY = /`(F2\.[A-Z0-9]+\.[a-z-]+)`/g;
const MODULE_CODE = /^(m\d{2}|ms\d*|f\d+)$/;
const FILE_EXTENSION = /^(tsx?|jsx?|mjs|cjs|css|md|json|ya?ml|sql|txt|sh|html)$/;

interface Matrix {
  ids: Set<string>;
  areas: Set<string>;
  names: Set<string>;
  rowKeys: Set<string>;
  /** What the PRD itself spells as `<area>.<name>`: events, never capabilities. */
  prdNamed: Set<string>;
}

export function findCapabilityCitationProblems(repo: string): string[] {
  const matrix = readMatrix(repo);
  const files = gitFiles(repo, [TASKS, BRIEFS]).filter((file) =>
    /^docs\/(tasks|ux\/briefs)\/[^/]+\.md$/.test(file),
  );
  if (matrix.ids.size === 0 || files.length === 0) {
    throw new Error('capability-ids-cited: nothing to read — no capability ids or no task files');
  }
  return files.flatMap((file) =>
    readFileSync(join(repo, file), 'utf8')
      .split('\n')
      .flatMap((line, index) =>
        citationProblems(line, matrix).map((problem) => `${file}:${index + 1} ${problem}`),
      ),
  );
}

export function runCapabilityIdsCited(repo: string): void {
  const problems = findCapabilityCitationProblems(repo);
  if (problems.length > 0) {
    throw new Error(
      `capability-ids-cited: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`,
    );
  }
  console.log('capability ids cited — every capability a task or brief names is in the matrix');
}

function readMatrix(repo: string): Matrix {
  const ids = new Set<string>(Object.keys(CAPABILITY_MATRIX));
  const prdNamed = new Set(
    prdFiles(repo).flatMap((file) =>
      [...readFileSync(join(repo, file), 'utf8').matchAll(CITED)].map(
        ([, area = '', name = '']) => `${area}.${name}`,
      ),
    ),
  );
  return {
    ids,
    areas: new Set([...ids].map((id) => id.split('.')[0] ?? '')),
    names: new Set([...ids].map((id) => id.split('.')[1] ?? '')),
    rowKeys: new Set(
      [...Object.values(CAPABILITY_MATRIX), ...Object.values(VISIBILITY_MATRIX)].flatMap((row) =>
        row ? [row.rowKey] : [],
      ),
    ),
    prdNamed: new Set([...prdNamed].filter((named) => !ids.has(named))),
  };
}

function citationProblems(line: string, matrix: Matrix): string[] {
  const ids = [...line.matchAll(CITED)].flatMap(([, area = '', name = '']) => {
    const cited = `${area}.${name}`;
    if (FILE_EXTENSION.test(name) || matrix.prdNamed.has(cited) || matrix.ids.has(cited)) return [];
    if (MODULE_CODE.test(area)) return [`cites ${cited}: a capability is named by its area`];
    if (matrix.areas.has(area) || matrix.names.has(name)) {
      return [`cites ${cited}, which the capability matrix does not hold`];
    }
    return [];
  });
  const rowKeys = [...line.matchAll(ROW_KEY)].flatMap(([, key = '']) =>
    matrix.rowKeys.has(key) ? [] : [`cites ${key}, which no capability or visibility row key is`],
  );
  return [...ids, ...rowKeys];
}
