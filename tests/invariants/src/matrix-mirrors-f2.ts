import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CAPABILITY_MATRIX,
  type CapabilityGrant,
  type CapabilityRow,
  DOMAIN_LADDERS,
  type LadderScope,
  ROLE_PRESETS,
  type RolePreset,
  VISIBILITY_MATRIX,
  type VisibilityCell,
  type VisibilityDomain,
  type VisibilityRow,
  type VisibilityScope,
} from '@heliogrid/domain';
import { REPO_ROOT } from './repo-root';

/**
 * F2-25: the matrices in `docs/prd/foundations/F2-roles-and-permissions.md` §F2.5 are the only
 * permission truth. This invariant reads every table there and holds the code equal cell for
 * cell — the presets as columns in F2-01's order, every fixed row present with the PRD's cells,
 * every visibility cell on a ladder that has its rung, and no row in code the PRD does not fix.
 * A cell changed in either place without the other is red here before it is a leak anywhere.
 *
 * Static: nothing here touches a database. It lives in this package rather than beside the
 * domain's unit tests because a package may not import a file outside itself, and the book is
 * outside every package.
 */
const PRD_PATH = join(REPO_ROOT, 'docs/prd/foundations/F2-roles-and-permissions.md');

/** The twelve display names F2-01 fixes, as the PRD writes its column headers. */
const PRESET_BY_NAME: Readonly<Record<string, RolePreset>> = {
  'EPC Owner': 'epc_owner',
  'Sales Manager': 'sales_manager',
  'Sales Executive': 'sales_executive',
  'Survey Engineer': 'survey_engineer',
  'Design Engineer': 'design_engineer',
  'Project Manager': 'project_manager',
  'Field Technician': 'field_technician',
  'Installation Team Member': 'installation_team_member',
  'HR/Admin': 'hr_admin',
  Finance: 'finance',
  Operations: 'operations',
  Marketing: 'marketing',
};

const SCOPE_WORDS: Readonly<Record<string, VisibilityScope>> = {
  All: 'all',
  Team: 'team',
  Own: 'own',
  Assigned: 'assigned',
  Portfolio: 'portfolio',
};

interface PrdRow {
  readonly key: string;
  readonly phrase: string;
  readonly cells: Readonly<Record<RolePreset, string>>;
}

interface PrdTable {
  readonly heading: string;
  columns: readonly string[];
  readonly rows: PrdRow[];
}

const splitRow = (line: string): string[] =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Every `#### F2.5-…` table: its column names and its `F2.` rows, cells keyed by preset. */
function matrixTables(markdown: string): PrdTable[] {
  const tables: PrdTable[] = [];
  for (const line of markdown.split('\n')) {
    const heading = /^#### (F2\.5-\S+)/.exec(line);
    if (heading?.[1]) {
      tables.push({ heading: heading[1], columns: [], rows: [] });
      continue;
    }
    const table = tables.at(-1);
    if (!table) continue;
    if (line.startsWith('| Row key')) table.columns = splitRow(line).slice(1, -1);
    if (line.startsWith('| `F2.')) table.rows.push(prdRow(splitRow(line)));
  }
  return tables;
}

function prdRow(cells: string[]): PrdRow {
  const head = /^`(F2\.[^`]+)`\s*·\s*(.*)$/.exec(cells[0] ?? '');
  if (!head?.[1]) throw new Error(`matrix-mirrors-f2: unreadable matrix row: ${cells[0]}`);
  const byPreset = Object.fromEntries(
    ROLE_PRESETS.map((preset, i) => [preset, cells[i + 1] ?? '']),
  );
  return { key: head[1], phrase: head[2] ?? '', cells: byPreset as Record<RolePreset, string> };
}

/** The PRD numbers a module; the code names the area it holds (CLAUDE.md §8: a file is named for what it holds, never by a document id). */
const AREA_BY_MODULE: Readonly<Record<string, string>> = {
  M01: 'onboarding',
  M02: 'crm',
  M03: 'marketing',
  M04: 'survey',
  M05: 'studio',
  M06: 'proposals',
  M07: 'sales',
  M08: 'projects',
  M09: 'field',
  M10: 'hr',
  M11: 'payments',
  M12: 'billing',
  M13: 'reports',
  F5: 'customer_link',
};

/** `F2.M02.add-edit-leads` → `crm.add_edit_leads`; a module with no area named is a loud stop, never a guessed id. */
function capabilityIdOf(rowKey: string): string {
  const [, module = '', slug = ''] = rowKey.split('.');
  const area = AREA_BY_MODULE[module];
  if (area === undefined) {
    throw new Error(
      `matrix-mirrors-f2: ${rowKey} belongs to ${module}, which has no area in AREA_BY_MODULE — name the area the new table holds (CLAUDE.md §8), then add its file beside capabilities.ts`,
    );
  }
  return `${area}.${slug.replaceAll('-', '_')}`;
}

/** The PRD's cell forms for a capability row (§F2.5 "How to read the matrices"). */
function grantOf(cell: string): CapabilityGrant {
  if (cell === '—') return { held: false };
  if (cell === '✓') return { held: true };
  const scoped = /^✓ \((.*)\)$/.exec(cell);
  return { held: true, limitedTo: scoped?.[1] ?? cell };
}

const isRung = (domain: VisibilityDomain, word: VisibilityScope): word is LadderScope =>
  DOMAIN_LADDERS[domain].some((rung) => rung === word);

/**
 * A visibility cell: the scope word is the grant, the rest a verbatim qualifier. A cell reads
 * THROUGH the projects domain when its rung is not on this domain's ladder (`Portfolio` in
 * leads) or its qualifier names projects from another domain ("Own projects' deals (read)").
 */
function visibilityOf(cell: string, domain: VisibilityDomain): VisibilityCell {
  if (cell === '—') return { scope: 'none' };
  const text = /^✓ \((.*)\)$/.exec(cell)?.[1] ?? cell;
  const [first = '', ...rest] = text.split(' ');
  const word = SCOPE_WORDS[first];
  if (word === undefined) return { scope: 'all', qualifier: text };
  const qualifier = rest.join(' ');
  const throughProjects =
    domain !== 'projects' &&
    isRung('projects', word) &&
    (!isRung(domain, word) || qualifier.startsWith('projects'));
  if (throughProjects) return { scope: word, qualifier, through: 'projects' };
  return rest.length === 0 ? { scope: word } : { scope: word, qualifier };
}

type VisibilityRows = readonly (readonly [VisibilityDomain, VisibilityRow])[];

const visibilityRows = (): VisibilityRows =>
  Object.entries(VISIBILITY_MATRIX).filter(
    (entry): entry is [VisibilityDomain, VisibilityRow] => entry[1] !== undefined,
  );

/** Every code cell sits on a ladder that has its rung: its own domain's, or the one it reads through. */
function ladderProblems(rows: VisibilityRows): string[] {
  const problems: string[] = [];
  for (const [domain, row] of rows) {
    for (const preset of ROLE_PRESETS) {
      const cell = row.cells[preset];
      if (cell.scope === 'none' || cell.scope === 'assigned') continue;
      const ladderOf = cell.through ?? domain;
      if (!isRung(ladderOf, cell.scope)) {
        problems.push(
          `${domain} · ${preset}: rung ${cell.scope} is not on the ${ladderOf} ladder, so a fold would drop it`,
        );
      }
    }
  }
  return problems;
}

function columnProblems(tables: readonly PrdTable[]): string[] {
  return tables
    .filter(
      (table) =>
        !same(
          table.columns.map((name) => PRESET_BY_NAME[name]),
          [...ROLE_PRESETS],
        ),
    )
    .map((table) => `${table.heading}: columns are not F2-01's twelve presets in its order`);
}

function visibilityRowProblems(
  row: PrdRow,
  domain: VisibilityDomain,
  code: VisibilityRow,
): string[] {
  return ROLE_PRESETS.flatMap((preset) => {
    const expected = visibilityOf(row.cells[preset], domain);
    return same(code.cells[preset], expected)
      ? []
      : [
          `${row.key} · ${preset}: code ${JSON.stringify(code.cells[preset])}, PRD ${JSON.stringify(expected)}`,
        ];
  });
}

function capabilityRowProblems(row: PrdRow, code: CapabilityRow | undefined): string[] {
  if (!code || code.rowKey !== row.key) {
    return [`${row.key}: no capability row in code (expected id ${capabilityIdOf(row.key)})`];
  }
  return ROLE_PRESETS.flatMap((preset) => {
    const expected = grantOf(row.cells[preset]);
    return same(code.grants[preset], expected)
      ? []
      : [
          `${row.key} · ${preset}: code ${JSON.stringify(code.grants[preset])}, PRD ${JSON.stringify(expected)}`,
        ];
  });
}

function rowProblems(prdRows: readonly PrdRow[], visibility: VisibilityRows): string[] {
  const byRowKey = new Map(
    visibility.map(([domain, row]) => [row.rowKey as string, { domain, row }]),
  );
  const capabilityById: Readonly<Record<string, CapabilityRow>> = CAPABILITY_MATRIX;
  return prdRows.flatMap((row) => {
    const held = byRowKey.get(row.key);
    if (held) return visibilityRowProblems(row, held.domain, held.row);
    if (row.phrase.includes('as cells')) {
      return [
        `${row.key} reads as a domain's cells in the PRD but is not a visibility row in code`,
      ];
    }
    return capabilityRowProblems(row, capabilityById[capabilityIdOf(row.key)]);
  });
}

function extraRowProblems(prdRows: readonly PrdRow[], visibility: VisibilityRows): string[] {
  const prdKeys = new Set(prdRows.map((row) => row.key));
  const codeKeys = [
    ...Object.values(CAPABILITY_MATRIX).map((row) => row.rowKey),
    ...visibility.map(([, row]) => row.rowKey),
  ];
  return codeKeys
    .filter((key) => !prdKeys.has(key))
    .map((key) => `${key}: in code, but no §F2.5 table fixes it`);
}

export function runMatrixMirrorsF2(): void {
  const tables = matrixTables(readFileSync(PRD_PATH, 'utf8'));
  const prdRows = tables.flatMap((table) => table.rows);
  if (tables.length === 0 || prdRows.length === 0) {
    throw new Error(
      `matrix-mirrors-f2: no §F2.5 table found in ${PRD_PATH} — a vacuous pass is worse than none`,
    );
  }
  const visibility = visibilityRows();
  const problems = [
    ...ladderProblems(visibility),
    ...columnProblems(tables),
    ...rowProblems(prdRows, visibility),
    ...extraRowProblems(prdRows, visibility),
  ];
  if (problems.length > 0) {
    throw new Error(
      `matrix-mirrors-f2: ${problems.length} problem(s) against F2 §F2.5:\n  - ${problems.join('\n  - ')}\n\n  The CELL wins (packages/domain/CLAUDE.md): change the code, or change the PRD with its ruling.`,
    );
  }
  console.log(
    `matrix mirrors F2 — ${tables.length} tables, ${prdRows.length - visibility.length} capability rows and ${visibility.length} visibility rows equal §F2.5 cell for cell; every rung on its ladder; twelve columns in F2-01 order`,
  );
}
