import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The files a static invariant reads, listed the two ways the checks it replaced listed them:
 * what git would commit, or every file on disk under a folder. Paths come back relative to `repo`,
 * so a finding names the file the way a person opens it.
 */

/** Tracked and untracked-but-not-ignored files under `paths`, skipping any deleted from disk. */
export function gitFiles(repo: string, paths: readonly string[]): string[] {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', ...paths], {
    cwd: repo,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
    .split('\n')
    .filter((file) => file !== '' && existsSync(join(repo, file)));
}

/** Every file under `folder` (relative to `repo`), never descending into a folder `skip` names. */
export function walkFiles(repo: string, folder: string, skip: ReadonlySet<string>): string[] {
  const full = join(repo, folder);
  if (!existsSync(full)) return [];
  if (!statSync(full).isDirectory()) return [folder];
  return readdirSync(full)
    .sort()
    .flatMap((entry) => {
      const path = join(folder, entry);
      if (statSync(join(repo, path)).isDirectory()) {
        return skip.has(entry) ? [] : walkFiles(repo, path, skip);
      }
      return [path];
    });
}

/** The 1-based line of `index` in `text`. */
export function lineAt(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

/** Only the newlines of `text` — what a blanked comment leaves, so every later line keeps its number. */
export function newlinesOf(text: string): string {
  return text.replace(/[^\n]/g, '');
}
