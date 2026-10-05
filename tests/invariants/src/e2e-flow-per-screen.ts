import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { walkFiles } from './repo-files';

/**
 * Every web route and every phone screen has its regression flow.
 *
 * By file NAME only — a spec's text is never searched for a route, which a comment could fake;
 * whether the flow really drives its screen is the reviewer's. A route is the folder of a `page`
 * file at any depth: its `(group)` folders are not in the URL, the rest join with `-`, and `/` is
 * `root`. A phone screen is the folder of a `*Screen.tsx` at any depth under screens/, joined the
 * same way. A route's flow is `tests/e2e/web/<route>.spec.ts`; a screen's is
 * `tests/e2e/mobile/<screen>.yaml`.
 *
 * And no phone flow is forgotten: every top-level `tests/e2e/mobile/*.yaml` is run by `run.sh`, and
 * every `steps/*.yaml` is called by `run.sh` or by a flow. Only a call counts — a `flow …` line of
 * `run.sh`, a `runFlow:` or `file:` line of a flow — never a comment or an echo. `run.sh` lists its
 * flows by hand, so a flow left off it never runs.
 */
const WEB_APP = 'apps/web/app';
const PHONE_SCREENS = 'apps/mobile/src/screens';
const PAGE = /^page\.(.*\.)?(tsx|ts|jsx|js)$/;
const SCREEN = /Screen\.tsx$/;
const PHONE_SUITE = 'tests/e2e/mobile';
const PHONE_RUNNER = `${PHONE_SUITE}/run.sh`;
const FLOW = /\.yaml$/;

/**
 * The phone screens held without a flow, each with its reason. A held screen that is gone, or that
 * has its flow now, fails — so the list empties as flows land. ADDING a screen here is a harness
 * change, which review holds.
 */
const PHONE_SCREENS_HELD: ReadonlyMap<string, string> = new Map([
  [
    'shell',
    'reached only by a member with a company: no flow yet signs a seeded member in, and the ' +
      "sign-up flow's Create company press never reaches the api on iOS inside Maestro, while the " +
      'same tap on a still screen does — it is checked by hand',
  ],
]);

/** Files under `folder` whose name passes `test`, never inside a hidden folder. */
function filesNamed(repo: string, folder: string, test: RegExp): string[] {
  return walkFiles(repo, folder, new Set())
    .filter((file) => !file.split('/').some((part) => part.startsWith('.')))
    .filter((file) => test.test(basename(file)));
}

function flowName(file: string, under: string, dropGroups: boolean): string {
  const parts = relative(under, dirname(file)).split('/');
  const kept = parts.filter((part) => part !== '' && !(dropGroups && part.startsWith('(')));
  return kept.join('-') || 'root';
}

function scanFlows(repo: string): { findings: string[]; routes: number; screens: number } {
  const routes = new Set(filesNamed(repo, WEB_APP, PAGE).map((f) => flowName(f, WEB_APP, true)));
  const screens = new Set(
    filesNamed(repo, PHONE_SCREENS, SCREEN).map((f) => flowName(f, PHONE_SCREENS, false)),
  );
  if (routes.size === 0 || screens.size === 0) {
    throw new Error(
      `e2e-flow-per-screen: found ${routes.size} web routes under ${WEB_APP} and ${screens.size} ` +
        `phone screens under ${PHONE_SCREENS}, expected at least one of each — the trees moved, ` +
        'and a scan of nothing reports a pass it never earned',
    );
  }
  const owed = [
    ...[...routes].map((route) => `tests/e2e/web/${route}.spec.ts`),
    ...[...screens]
      .filter((screen) => !PHONE_SCREENS_HELD.has(screen))
      .map((screen) => `tests/e2e/mobile/${screen}.yaml`),
  ].sort();
  const missing = owed
    .filter((flow) => !existsSync(join(repo, flow)))
    .map((flow) => `${flow}: missing — its screen has no regression flow`);
  const staleHolds = [...PHONE_SCREENS_HELD.keys()]
    .filter(
      (screen) => !screens.has(screen) || existsSync(join(repo, `tests/e2e/mobile/${screen}.yaml`)),
    )
    .map(
      (screen) => `held screen '${screen}' no longer needs holding — it is gone or has its flow`,
    );
  return { findings: [...missing, ...staleHolds], routes: routes.size, screens: screens.size };
}

const RUNNER_CALL = /^\s*flow\s.*$/gm;
const FLOW_CALL = /^\s*-?\s*(?:runFlow|file):.*$/gm;

/** Whether one of `text`'s call lines names `flow`; a `#` comment on the line is dropped first. */
function callsFlow(text: string, call: RegExp, flow: string): boolean {
  const escaped = flow.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const named = new RegExp(`(^|[\\s"'=])${escaped}($|[\\s"'])`);
  return (text.match(call) ?? []).some((line) => named.test(line.replace(/(^|\s)#.*$/, '$1')));
}

function scanPhoneSuite(repo: string): { findings: string[]; flows: number } {
  const all = filesNamed(repo, PHONE_SUITE, FLOW).map((file) => relative(PHONE_SUITE, file));
  const topLevel = all.filter((flow) => !flow.includes('/'));
  const steps = all.filter((flow) => flow.startsWith('steps/') && flow.split('/').length === 2);
  const stray = all.filter((flow) => flow.includes('/') && !steps.includes(flow));
  if (!existsSync(join(repo, PHONE_RUNNER)) || topLevel.length === 0) {
    throw new Error(
      `e2e-flow-per-screen: found ${topLevel.length} phone flows under ${PHONE_SUITE} and ` +
        `${existsSync(join(repo, PHONE_RUNNER)) ? 'its' : 'no'} run.sh — the suite moved, and a ` +
        'scan of nothing reports a pass it never earned',
    );
  }
  const runner = readFileSync(join(repo, PHONE_RUNNER), 'utf8');
  const flowTexts = all.map((flow) => readFileSync(join(repo, PHONE_SUITE, flow), 'utf8'));
  const notRun = topLevel
    .filter((flow) => !callsFlow(runner, RUNNER_CALL, flow))
    .map((flow) => `${PHONE_SUITE}/${flow}: never run — ${PHONE_RUNNER} does not run it`);
  const notCalled = steps
    .filter(
      (step) =>
        !callsFlow(runner, RUNNER_CALL, step) &&
        !flowTexts.some((text) => callsFlow(text, FLOW_CALL, step)),
    )
    .map((step) => `${PHONE_SUITE}/${step}: never called — neither run.sh nor a flow calls it`);
  const strays = stray.map(
    (flow) => `${PHONE_SUITE}/${flow}: neither a top-level flow nor a step — move it`,
  );
  return { findings: [...notRun, ...notCalled, ...strays], flows: all.length };
}

export function findScreensWithoutFlow(repo: string): string[] {
  return [...scanFlows(repo).findings, ...scanPhoneSuite(repo).findings];
}

export function runE2eFlowPerScreen(repo: string): void {
  const screenFlows = scanFlows(repo);
  const phoneSuite = scanPhoneSuite(repo);
  const findings = [...screenFlows.findings, ...phoneSuite.findings];
  if (findings.length > 0) {
    throw new Error(
      `e2e-flow-per-screen: every web route and phone screen has its regression flow, and every phone flow runs:\n  ${findings.join('\n  ')}`,
    );
  }
  console.log(
    `e2e-flow-per-screen OK — ${screenFlows.routes} web routes and ${screenFlows.screens} phone ` +
      `screens, each with its flow but ${PHONE_SCREENS_HELD.size} held; ${phoneSuite.flows} phone ` +
      'flows, each run',
  );
}
