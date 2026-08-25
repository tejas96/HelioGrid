#!/usr/bin/env node
/**
 * ds:contract — the MEANING gate (docs/engineering/17-ui-architecture-v2.md §6). Lint gate 6 of 6.
 *
 * Every other gate in `scripts/lint-all.sh` measures SHAPE: the file exists, it parses, it imports
 * in the allowed direction, the census matches. Seven audit rounds have found behaviour defects in
 * packages/ui with all of them green. This gate asks the eight questions that shape cannot:
 *
 *   scripts/ds-contract/contracts.mjs         (a) WEAKENED / (b) DROPPED / (c) RAW EMIT
 *       Does each ported prop still MEAN what the design system's typings say it means?
 *   (d) FALSE EXCUSE was REMOVED 2026-08-25. It matched comment prose against a 24-phrase
 *       vocabulary, and was wrong in both directions: deleting only the excuse comment while
 *       keeping the dropped prop passed green — it fired on the sentence, never the code — and
 *       a correct attribution ("a dismiss affordance belongs to the IconButton a caller places
 *       beside it") failed the gate because IconButton exists. The only escape was rewording
 *       prose until a regex passed, which is the behaviour it existed to punish.
 *   scripts/ds-contract/platform-props.mjs    (i) PLATFORM-LOCAL PROP
 *       Do the two platform interfaces above the shared base declare the same props? Law 7
 *       says a prop on one platform only is a defect and calls it "held by a TYPE" — but the
 *       type holds only the shared base, and 89 of 95 components extend it per-platform.
 *   scripts/ds-contract/native-a11y.mjs       (e) INERT A11Y
 *   scripts/ds-contract/native-fold.mjs       (f) FOLDED CONTROL
 *   scripts/ds-contract/native-role.mjs       (g) DISHONEST ROLE
 *       Is accessibility state hung on a node that is not an accessibility element? Does
 *       `accessible` fold a focusable control out of reach? Does a `progressbar` promise a
 *       position it has no `accessibilityValue` to give?
 *   scripts/ds-contract/semantic-parity.mjs   (h) SEMANTIC DRIFT  [+ (h·i), informational]
 *       Do the two platform halves of one component declare the SAME accessibility vocabulary?
 *
 * (e) AND (f) ARE ONE PAIR. (e) alone teaches the wrong repair — "add `accessible` to the wrapper"
 * — which is the WORSE defect, because it trades a silent state for an unreachable control. That
 * counter-trap was written out in native-a11y.mjs's header from the start, was read, and was then
 * shipped LIVE twice anyway (Image/ImageStates, QRCode). Prose in a header is not a gate; (f) is.
 *
 * (h) IS ROUND SEVEN'S ANSWER, and it is the largest single class any round has produced: seven of
 * that round's nine defects were one shape — a web half declaring a role and an ARIA state beside a
 * native half declaring neither, so the control's state was carried by COLOUR ALONE (F7-12). Ten
 * components. Every one of them mechanically comparable, and no check looked.
 *
 * Each module's header documents what it catches AND what it cannot see. Read those before trusting
 * a green run: overstated coverage is how ~36 defects shipped behind nine green gates. Between them
 * these close a handful of mechanically-detectable classes. They say nothing about defaults, focus
 * order, tokens, copy or state — the majority of what the audits found. SEVEN CONSECUTIVE ROUNDS
 * HAVE EACH FOUND SOMETHING THE GATES OF THE DAY MISSED; there is no reason to think round eight
 * will not.
 *
 * (d·i) and (h·i) are INFORMATIONAL and never fail the gate: a comment naming something genuinely
 * absent, and a live-region difference that is Android-only by construction. Both are kept visible
 * so a real gap does not disappear into a passing run.
 *
 * Usage:  node scripts/ds-contract.mjs [--contracts <dir>]
 */
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { auditContracts } from './ds-contract/contracts.mjs';
import { maskComments } from './ds-contract/jsx.mjs';
import {
  ADHERENCE,
  byName,
  DEFAULT_CONTRACTS,
  rel,
  sources,
  UI,
  UI_SRC,
} from './ds-contract/lib.mjs';
import { A11Y_EXPLAINER, auditInertA11y } from './ds-contract/native-a11y.mjs';
import { auditFolds, FOLD_EXPLAINER } from './ds-contract/native-fold.mjs';
import { auditRoleHonesty, ROLE_EXPLAINER } from './ds-contract/native-role.mjs';
import { auditPlatformProps } from './ds-contract/platform-props.mjs';
import {
  auditSemanticParity,
  exemptionReport,
  PARITY_EXPLAINER,
} from './ds-contract/semantic-parity.mjs';

function contractsArg(argv) {
  const flag = argv.indexOf('--contracts');
  return flag !== -1 && argv[flag + 1] ? resolve(argv[flag + 1]) : DEFAULT_CONTRACTS;
}

function componentFolders() {
  return readdirSync(UI).filter((name) => statSync(join(UI, name)).isDirectory());
}

function report(label, lines, note) {
  if (lines.length === 0) return;
  console.log(`INFORMATIONAL — ${lines.length} ${label}`);
  for (const line of lines.sort(byName)) console.log(`  · ${line}`);
  console.log(`${note}\n`);
}

/** Every check run once, over one read of the tree. */
function runChecks(contractsDir) {
  const files = sources(UI_SRC);
  const scanned = files.map((entry) => ({ ...entry, masked: maskComments(entry.source) }));
  const folders = componentFolders();
  return {
    files,
    folders,
    contract: auditContracts(contractsDir),
    platform: auditPlatformProps(),
    inert: auditInertA11y(scanned),
    folded: auditFolds(scanned),
    dishonest: auditRoleHonesty(scanned),
    parity: auditSemanticParity(),
  };
}

function printHeader(run, contractsDir) {
  const { contract, files, folders, parity } = run;
  console.log('ds:contract — prop contracts, native accessibility-element hygiene and');
  console.log('              web/native semantic parity');
  console.log(`  contracts:  ${rel(contractsDir)} (${contract.contracts} files)`);
  console.log(`  adherence:  ${rel(ADHERENCE)} (${contract.allowlists} allowlists)`);
  console.log(`  audited:    ${contract.audited} components with both a contract and a port`);
  console.log(
    `  scanned:    ${files.length} sources under ${rel(UI_SRC)} (${folders.length} folders)`,
  );
  console.log(`  paired:     ${parity.pairs} <Name>.tsx ↔ <Name>.native.tsx file pairs\n`);

  const exempt = exemptionReport(parity.exemptions);
  if (exempt.length === 0) return;
  console.log('(h) SANCTIONED EXEMPTIONS APPLIED — enumerated, never a silent skip');
  for (const line of exempt) console.log(line);
  console.log('');
}

/** The explainer for every check that actually fired — each printed at most once. */
function printExplainers(run) {
  const pairs = [
    [run.inert, A11Y_EXPLAINER],
    [run.folded, FOLD_EXPLAINER],
    [run.dishonest, ROLE_EXPLAINER],
    [run.parity.findings, PARITY_EXPLAINER],
  ];
  for (const [lines, explainer] of pairs) {
    if (lines.length > 0) console.log(`\n${explainer}`);
  }
}

function main() {
  const contractsDir = contractsArg(process.argv.slice(2));
  const run = runChecks(contractsDir);
  const findings = [
    ...run.contract.findings,
    ...run.platform,
    ...run.inert,
    ...run.folded,
    ...run.dishonest,
    ...run.parity.findings,
  ].sort(byName);

  printHeader(run, contractsDir);
  report(
    'live-region / unpairable difference(s)',
    run.parity.informational,
    '  These do NOT fail the gate. `accessibilityLiveRegion` is Android-only and iOS\n' +
      '  announces imperatively, so neither presence nor absence proves anything.',
  );

  if (run.contract.contracts === 0) {
    console.log(`FAIL — no contracts under ${rel(contractsDir)}. Pass --contracts <dir>.\n`);
  } else if (findings.length === 0) {
    console.log('OK — no weakened, dropped or unrendered spec props, no inert native');
    console.log('     accessibility state, no folded controls, no position-less progressbars,');
    console.log('     no web/native semantic drift, and no platform-local prop on one');
    console.log('     half only. Eight checks;');
    console.log('     see §6 for what they still cannot see.\n');
    return;
  } else {
    console.log(`CONTRACT VIOLATIONS — ${findings.length}`);
    for (const line of findings) console.log(`  - ${line}`);
    printExplainers(run);
    console.log('\nFAIL — every line above is a contract the port does not honour.\n');
  }
  process.exitCode = 1;
}

main();
