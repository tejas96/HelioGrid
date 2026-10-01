import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lineAt } from './repo-files';

/**
 * A server image runs unprivileged.
 *
 * A process that runs as root turns one broken dependency into a rewritten application. Each
 * runtime image drops to the base image's `node` after its copies are made, so the application
 * directory is read-only to the process that runs it. Only the FINAL stage matters — a build stage
 * installs packages and must stay root — so the check reads what follows the last FROM, and the
 * last USER there is the user the CMD runs as: `USER root` or `USER 0` after `USER node` undoes it.
 */
const FROM = /^FROM\s/gim;
const USER = /^[ \t]*USER[ \t]+([a-z0-9_-]+)(?::\S*)?[ \t]*$/gim;
const ROOT_USERS = new Set(['root', '0']);

function dockerfiles(repo: string): string[] {
  const apps = join(repo, 'apps');
  if (!existsSync(apps)) return [];
  return readdirSync(apps)
    .sort()
    .map((app) => `apps/${app}/Dockerfile`)
    .filter((file) => existsSync(join(repo, file)));
}

/** What the final stage leaves the process running as, or why it runs as root. */
function finalStageProblem(file: string, text: string): string | null {
  const stageStart = [...text.matchAll(FROM)].at(-1)?.index ?? 0;
  const users = [...text.slice(stageStart).matchAll(USER)];
  const last = users.at(-1);
  if (last === undefined) {
    return `${file}:${lineAt(text, stageStart)}: the final stage sets no USER, so its CMD runs as root`;
  }
  const user = (last[1] ?? '').toLowerCase();
  if (!ROOT_USERS.has(user)) return null;
  const line = lineAt(text, stageStart + last.index);
  return `${file}:${line}: the final stage's last USER is ${user}, so its CMD runs as root`;
}

function scanDockerfiles(repo: string): { findings: string[]; images: number } {
  const files = dockerfiles(repo);
  if (files.length === 0) {
    throw new Error(
      'dockerfile-unprivileged: found NO apps/*/Dockerfile — the images moved, and a scan of ' +
        'nothing reports a pass it never earned',
    );
  }
  const findings = files.flatMap((file) => {
    const problem = finalStageProblem(file, readFileSync(join(repo, file), 'utf8'));
    return problem === null ? [] : [problem];
  });
  return { findings, images: files.length };
}

export function findRootImages(repo: string): string[] {
  return scanDockerfiles(repo).findings;
}

export function runDockerfileUnprivileged(repo: string): void {
  const { findings, images } = scanDockerfiles(repo);
  if (findings.length > 0) {
    throw new Error(
      'dockerfile-unprivileged: a server image runs as root:\n  ' +
        findings.join('\n  ') +
        '\n  Add `USER node` after the copies in the final stage. The copies stay root-owned, ' +
        'which is the point: the runtime reads its own code and writes nothing.',
    );
  }
  console.log(
    `dockerfile-unprivileged OK — ${images} server images, each final stage drops to a non-root user`,
  );
}
