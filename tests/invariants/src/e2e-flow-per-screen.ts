import { existsSync } from 'node:fs';
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
 */
const WEB_APP = 'apps/web/app';
const PHONE_SCREENS = 'apps/mobile/src/screens';
const PAGE = /^page\.(.*\.)?(tsx|ts|jsx|js)$/;
const SCREEN = /Screen\.tsx$/;

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
      'same tap on a still screen does — qa-mobile drives it',
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

export function findScreensWithoutFlow(repo: string): string[] {
  return scanFlows(repo).findings;
}

export function runE2eFlowPerScreen(repo: string): void {
  const { findings, routes, screens } = scanFlows(repo);
  if (findings.length > 0) {
    throw new Error(
      `e2e-flow-per-screen: every web route and phone screen has its regression flow:\n  ${findings.join('\n  ')}`,
    );
  }
  console.log(
    `e2e-flow-per-screen OK — ${routes} web routes and ${screens} phone screens, each with its ` +
      `flow but ${PHONE_SCREENS_HELD.size} held`,
  );
}
