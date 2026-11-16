import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFiles } from './repo-files';

/**
 * Both halves of a `packages/ui` part are drawn from the same shared parts (Law 7, "one part per
 * job, never a copy"). When the web half imports a shared component and the phone half does not,
 * the phone has either hand-drawn its own copy — the Qualify chips' fat pills, a hand-made card
 * with no edge — or skips it for a reason. A reason is written once, in the phone half, on the
 * line `web-only part: Name — why` (or `web-only parts: A, B — why`). A part with no reason, a
 * reason with no words, and a reason for a part the halves no longer differ on are findings.
 * A type-only import is no part; a part reached through a child file of the same folder is
 * declared the same way, naming the child.
 */
const COMPONENTS = 'packages/ui/src/components/';
/* An import of another component folder, `../Name` or `../Name/File`, that is not type-only. */
const PART_IMPORT = /import\s+(type\s+)?[^;]*?from\s+'\.\.\/([A-Za-z0-9]+)[/']/g;
const WAIVER = /web-only parts?: ([A-Za-z0-9]+(?:, [A-Za-z0-9]+)*) — (\S[^\n*]*)/g;

function partsOf(text: string): Set<string> {
  const parts = new Set<string>();
  for (const match of text.matchAll(PART_IMPORT)) {
    if (match[1] === undefined && match[2] !== undefined) parts.add(match[2]);
  }
  return parts;
}

function waiversOf(text: string): Map<string, string> {
  const waived = new Map<string, string>();
  for (const match of text.matchAll(WAIVER)) {
    for (const name of (match[1] ?? '').split(', ')) waived.set(name, (match[2] ?? '').trim());
  }
  return waived;
}

/** The phone halves that have a web half beside them: `Folder/Part` and both files. */
function pairsOf(repo: string): { name: string; web: string; phone: string }[] {
  return gitFiles(repo, [COMPONENTS])
    .filter((file) => file.endsWith('.native.tsx'))
    .map((phone) => ({ phone, web: phone.replace(/\.native\.tsx$/, '.tsx') }))
    .filter(({ web }) => existsSync(join(repo, web)))
    .map(({ phone, web }) => ({ name: web.slice(COMPONENTS.length, -'.tsx'.length), web, phone }));
}

export function findUiHalvesShareParts(repo: string): { findings: string[]; pairs: number } {
  const pairs = pairsOf(repo);
  if (pairs.length === 0) {
    throw new Error(
      `ui-halves-share-parts: found NO web and phone pair under ${COMPONENTS} — the folder moved, ` +
        'and a scan that compared nothing reports a pass it never earned',
    );
  }
  const findings = pairs.flatMap(({ name, web, phone }) => {
    const own = name.split('/')[0];
    const webParts = partsOf(readFileSync(join(repo, web), 'utf8'));
    const phoneText = readFileSync(join(repo, phone), 'utf8');
    const phoneParts = partsOf(phoneText);
    const waived = waiversOf(phoneText);
    const skipped = [...webParts].filter((part) => part !== own && !phoneParts.has(part));
    const unexplained = skipped
      .filter((part) => !waived.has(part))
      .map(
        (part) =>
          `${phone}: the web half draws ${part}; the phone half neither imports it nor says why`,
      );
    const stale = [...waived.keys()]
      .filter((part) => !skipped.includes(part))
      .map(
        (part) => `${phone}: says "web-only part: ${part}", but the halves no longer differ on it`,
      );
    return [...unexplained, ...stale];
  });
  return { findings, pairs: pairs.length };
}

export function runUiHalvesShareParts(repo: string): void {
  const { findings, pairs } = findUiHalvesShareParts(repo);
  if (findings.length > 0) {
    throw new Error(
      'ui-halves-share-parts: a phone half skips a shared part its web half draws, so it has a ' +
        `hand-made copy or a reason nobody wrote:\n  ${findings.join('\n  ')}\n  Import the part's ` +
        'phone half; or, when the phone truly draws it another way, write one line in the phone ' +
        'half: `web-only part: Name — why`. Delete a line that no longer applies.',
    );
  }
  console.log(
    `ui-halves-share-parts OK — ${pairs} web and phone pairs, every skipped part explained`,
  );
}
