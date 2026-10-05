import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Starting a dev server never kills a process it did not start, and never truncates a log.
 *
 * A launch configuration that frees "its" port with `kill` shoots whatever listens there — the
 * owner's own api, a watcher another session started — and a log opened with `>` throws away the
 * sign-in codes and request lines the e2e suite and a QA pass read from it. So every launch
 * configuration and every app package pre-hook starts without killing, and every `tee` appends.
 * The one named configuration whose whole job is to free the dev ports is the owner's explicit
 * action and is the only command allowed to kill.
 */
const LAUNCH = '.claude/launch.json';
const APPS = 'apps';
const CLEAN_CONFIGURATION = 'clean-dev-ports';
const KILLS = /\b(?:kill|killall|pkill|kill-port)\b/;
const TRUNCATES = /:\s*>\s*["']?\$|\btee\b(?!\s+-a\b)/;
const PRE_HOOK = /^(?:pre|post)/;

type Launch = { configurations?: { name?: string; runtimeArgs?: string[] }[] };
type Manifest = { scripts?: Record<string, string> };

function launchFindings(repo: string): { findings: string[]; configurations: number } {
  const path = join(repo, LAUNCH);
  if (!existsSync(path)) return { findings: [], configurations: 0 };
  const { configurations = [] } = JSON.parse(readFileSync(path, 'utf8')) as Launch;
  const findings = configurations.flatMap(({ name = '?', runtimeArgs = [] }) => {
    const command = runtimeArgs.join(' ');
    const problems: string[] = [];
    if (name !== CLEAN_CONFIGURATION && KILLS.test(command)) {
      problems.push(`${LAUNCH}: configuration "${name}" kills a process it did not start`);
    }
    if (TRUNCATES.test(command)) {
      problems.push(`${LAUNCH}: configuration "${name}" truncates a log instead of appending`);
    }
    return problems;
  });
  return { findings, configurations: configurations.length };
}

function hookFindings(repo: string): { findings: string[]; manifests: number } {
  const apps = join(repo, APPS);
  if (!existsSync(apps)) return { findings: [], manifests: 0 };
  const manifests = readdirSync(apps)
    .sort()
    .map((app) => `${APPS}/${app}/package.json`)
    .filter((file) => existsSync(join(repo, file)));
  const findings = manifests.flatMap((file) => {
    const { scripts = {} } = JSON.parse(readFileSync(join(repo, file), 'utf8')) as Manifest;
    return Object.entries(scripts)
      .filter(([name, command]) => PRE_HOOK.test(name) && KILLS.test(command))
      .map(([name]) => `${file}: the "${name}" hook kills a process it did not start`);
  });
  return { findings, manifests: manifests.length };
}

function scanLaunches(repo: string): {
  findings: string[];
  configurations: number;
  manifests: number;
} {
  const launch = launchFindings(repo);
  const hooks = hookFindings(repo);
  if (launch.configurations === 0 || hooks.manifests === 0) {
    throw new Error(
      `launch-reuses-running-servers: found NO launch configuration in ${LAUNCH} or NO ` +
        `${APPS}/*/package.json — the scan matched nothing, so it proves nothing`,
    );
  }
  return {
    findings: [...launch.findings, ...hooks.findings],
    configurations: launch.configurations,
    manifests: hooks.manifests,
  };
}

export function findLaunchKills(repo: string): string[] {
  return scanLaunches(repo).findings;
}

export function runLaunchReusesRunningServers(repo: string): void {
  const { findings, configurations, manifests } = scanLaunches(repo);
  if (findings.length > 0) {
    throw new Error(
      'launch-reuses-running-servers: a dev server start kills or truncates:\n  ' +
        findings.join('\n  ') +
        `\n  A running HelioGrid server is reused; a foreign one is freed by the owner through the ` +
        `"${CLEAN_CONFIGURATION}" configuration; a log is opened with \`tee -a\`.`,
    );
  }
  console.log(
    `launch-reuses-running-servers OK — ${configurations} launch configurations and ` +
      `${manifests} app manifests start without killing and append their logs`,
  );
}
