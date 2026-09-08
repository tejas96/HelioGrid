import { execFileSync } from 'node:child_process';

/* `git rev-parse` rather than a path walk from this file: the package compiles to CommonJS, so
   `import.meta` is unavailable, and cwd differs between `pnpm --filter` and `turbo test`. */
export const REPO_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim();
