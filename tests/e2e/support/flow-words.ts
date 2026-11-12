import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SUITE = join(import.meta.dirname, '..', 'mobile');
const FLOW_WORD = /\$\{([A-Z][A-Z0-9_]*)\}/g;
const RUNNER_WORD = /-e "([A-Z][A-Z0-9_]*)=/g;
/** A word one flow hands a step in its `runFlow` `env:` — Maestro's own keys are camelCase. */
const PASSED_WORD = /^\s+([A-Z][A-Z0-9_]*):/gm;

function flowFiles(): string[] {
  const top = readdirSync(SUITE).filter((name) => name.endsWith('.yaml'));
  const steps = readdirSync(join(SUITE, 'steps')).filter((name) => name.endsWith('.yaml'));
  return [
    ...top.map((name) => join(SUITE, name)),
    ...steps.map((name) => join(SUITE, 'steps', name)),
  ];
}

/**
 * Every `${WORD}` a phone flow reads is one the words step writes, `run.sh` passes with `-e` or a
 * flow passes a step in `env:`.
 * Maestro reads an unknown one as the text "undefined" and fails only when that flow is reached,
 * twenty minutes into the suite, so a word renamed in `packages/i18n` stops the run here first.
 */
export function assertEveryFlowWordKnown(written: readonly string[]): void {
  const runner = readFileSync(join(SUITE, 'run.sh'), 'utf8');
  const flows = flowFiles().map((file) => ({ file, text: readFileSync(file, 'utf8') }));
  const known = new Set([
    ...written,
    ...[...runner.matchAll(RUNNER_WORD)].map((match) => match[1]),
    ...flows.flatMap(({ text }) => [...text.matchAll(PASSED_WORD)].map((match) => match[1])),
  ]);
  const unknown = flows.flatMap(({ file, text }) =>
    [...text.matchAll(FLOW_WORD)]
      .map((match) => match[1])
      .filter((word) => word !== undefined && !known.has(word))
      .map((word) => `${file}: \${${word}} is no written word, run.sh -e value or env: word`),
  );
  if (unknown.length > 0) throw new Error(unknown.join('\n'));
}
