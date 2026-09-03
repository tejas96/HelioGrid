import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  formatCompactMoney,
  formatDate,
  formatLength,
  formatMoney,
  formatPhone,
  IN_FORMATS,
  PROCUREMENT_SYSTEM,
} from '@heliogrid/domain';

/**
 * The format layer's invariants — `F3-19` through `F3-24`, with the IN pack's values at
 * `F1-46` to `F1-50`.
 *
 * Static: nothing here touches a database. Formatting is the one foundation whose failure is
 * invisible in review — `92 lakh` and `92L` both look like reasonable code, and only the PRD
 * cell says which is right — so every expected string below is quoted from its row.
 */

/* `git rev-parse` rather than a path walk from this file: the package compiles to CommonJS, so
   `import.meta` is unavailable, and cwd differs between `pnpm --filter` and `turbo test`. */
const REPO_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim();

/** Anything that is a digit but is not Latin 0–9 (`F3-21`, `F1-47`). */
const NON_LATIN_DIGIT = /\p{Nd}/gu;

interface Expectation {
  readonly row: string;
  readonly what: string;
  readonly actual: string;
  readonly expected: string;
}

/**
 * `F1-46` and `F1-48`, character for character. A near-miss here is the whole defect class:
 * `₹92 lakh` renders, reads fine, and is not what the market declares.
 */
function renderedValues(): Expectation[] {
  return [
    {
      row: 'F1-46',
      what: 'money, Indian grouping',
      actual: formatMoney(IN_FORMATS, 452471),
      expected: '₹4,52,471',
    },
    {
      row: 'F1-46',
      what: 'money at the minor unit (paise)',
      actual: formatMoney(IN_FORMATS, 452471.5, { digits: IN_FORMATS.minorUnitDigits }),
      expected: '₹4,52,471.50',
    },
    {
      row: 'F1-46',
      what: 'compact money, lakh rung',
      actual: formatCompactMoney(IN_FORMATS, 9_200_000),
      expected: '₹92L',
    },
    {
      row: 'F1-46',
      what: 'compact money, crore rung',
      actual: formatCompactMoney(IN_FORMATS, 14_000_000),
      expected: '₹1.4 Cr',
    },
    {
      row: 'F1-48',
      what: 'date style',
      actual: formatDate(IN_FORMATS, '2026-03-12T06:00:00Z'),
      expected: '12 Mar 2026',
    },
    {
      /* 19:00 UTC is 00:30 the NEXT day in Asia/Kolkata. Rendered in the device's zone this
         reads 11 Mar — the exact failure `F3-22` names, and the one a passing typecheck and a
         green lint cannot see. */
      row: 'F3-22',
      what: 'date on the tenant timezone, not the device',
      actual: formatDate(IN_FORMATS, '2026-03-11T19:00:00Z'),
      expected: '12 Mar 2026',
    },
    {
      row: 'F1-49',
      what: 'phone display',
      actual: formatPhone(IN_FORMATS, '+919845027746'),
      expected: '+91 98450 27746',
    },
    {
      row: 'F3-23',
      what: 'procurement quantity stays metric for every user',
      actual: formatLength(IN_FORMATS, 4.2, PROCUREMENT_SYSTEM),
      expected: '4.2 m',
    },
  ];
}

/**
 * `F3-19` — ONE rendering implementation per capability, product-wide.
 *
 * Held structurally rather than by review: a second `Intl.NumberFormat` or `Intl.DateTimeFormat`
 * anywhere outside the format slice IS a second implementation, whatever it is called. This
 * found a real one on the day it was written — `OperationProgress` grouped its row counts by the
 * DEVICE's locale, so an Indian tenant on a US phone read `452,471` beside `4,52,471`.
 *
 * Comment lines are stripped first: a file that only MENTIONS the constructor in prose (this one
 * does, above) is not a second implementation.
 */
const FORMAT_SLICE = 'packages/domain/src/format/';
const INTL_CONSTRUCTOR = /new\s+Intl\.(?:NumberFormat|DateTimeFormat)\s*\(/;
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;

function secondImplementations(): string[] {
  const tracked = execFileSync('git', ['ls-files', 'packages', 'apps'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((path) => /\.(?:ts|tsx|mts|cts)$/.test(path) && !path.startsWith(FORMAT_SLICE));

  const found: string[] = [];
  for (const path of tracked) {
    /* `git ls-files` reports a file deleted in the working tree but not yet staged. A file that
       is not there cannot hold a second implementation. */
    const full = join(REPO_ROOT, path);
    if (!existsSync(full)) continue;
    const lines = readFileSync(full, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (COMMENT_LINE.test(line) || !INTL_CONSTRUCTOR.test(line)) return;
      found.push(`${path}:${index + 1}`);
    });
  }
  return found;
}

/**
 * `F3-21` / `F1-47` — Latin digits in every language, including documents. Checked over the
 * rendered set above rather than over a locale list, because the rendering is what ships.
 */
function nonLatinDigits(values: readonly Expectation[]): string[] {
  return values
    .filter(({ actual }) => [...actual.matchAll(NON_LATIN_DIGIT)].some((m) => !/[0-9]/.test(m[0])))
    .map(({ what, actual }) => `${what} → ${actual}`);
}

export function runFormatInvariants(): void {
  const values = renderedValues();
  const failures: string[] = [];

  for (const { row, what, actual, expected } of values) {
    if (actual !== expected)
      failures.push(`${row} ${what}: expected \`${expected}\`, got \`${actual}\``);
  }

  for (const site of secondImplementations()) {
    failures.push(
      `F3-19 second format implementation at ${site} — an Intl formatter outside ${FORMAT_SLICE}`,
    );
  }

  for (const value of nonLatinDigits(values)) {
    failures.push(`F3-21 non-Latin digits rendered: ${value}`);
  }

  if (failures.length > 0) {
    throw new Error(`FORMAT INVARIANT FAILURE\n  ${failures.join('\n  ')}`);
  }
  console.log(`format invariants green — ${values.length} rendered values, one implementation`);
}
