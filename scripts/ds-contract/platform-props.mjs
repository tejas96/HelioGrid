/**
 * (i) PLATFORM-LOCAL PROP — Law 7, actually held.
 *
 * WHY THIS EXISTS. CLAUDE.md Law 7 says "a prop on one platform only is a defect. Held by a
 * TYPE, not a script: both platform files import the one <Name>.types.ts". That is true of the
 * SHARED base and false of everything above it: 89 of the 95 components declare their own
 * `Web<N>Props` / `Native<N>Props` extending that base, and nothing holds the extensions to
 * each other: adding `align?: 'start' | 'center'` to `WebButtonProps`,
 * rendering it, and giving the native half nothing passes typecheck, biome AND this gate. The
 * law's headline defect was unenforced by anything, including the type it was retired onto
 * when `check-ui-parity.mjs` was deleted.
 *
 * WHAT IT COMPARES. Own-declared prop NAMES only — the members written inside each platform
 * interface, not the inherited base. Types are deliberately not compared: `style` is
 * `CSSProperties` on web and `StyleProp<ViewStyle>` on native, and demanding they match would
 * be wrong. Name presence is the axis Law 7 actually talks about.
 *
 * WHY THE EXEMPTION VOCABULARY IS CLOSED. Two names, both web-only because React Native has no
 * equivalent: `className` (87 components) and `as` (3, the polymorphic element prop). A
 * free-text or per-file waiver would let any prop talk its way out, which is the failure that
 * got check (d) deleted on the same day this was written. Adding a third name means editing
 * this array and justifying it in review.
 *
 * BASELINE WHEN WRITTEN: exactly one finding across 89 comparable components — StatusChip
 * accepts `style` on native and not on web. That is the intended signal-to-noise ratio; if
 * this check ever reports dozens, something changed in the architecture, not in the code.
 *
 * WHAT IT CANNOT SEE. A prop declared on both sides and rendered on only one; a prop whose
 * meaning drifts while its name holds; anything in a component that declares no platform-local
 * interface at all (6 of 95).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const UI_SRC = 'packages/ui/src/components';

/** Web-only by platform reality, not by preference. Closed on purpose — see the header. */
const WEB_ONLY = ['className', 'as'];

const MEMBER = /^[ \t]*(?:readonly[ \t]+)?([A-Za-z_$][\w$]*)\??[ \t]*:/gm;

/** Own-declared member names of one interface/type, comments stripped so prose cannot match. */
function ownProps(source, name) {
  const decl = new RegExp(`(?:interface|type)\\s+${name}\\b[^{]*\\{`);
  const at = source.search(decl);
  if (at === -1) return null;
  const open = source.indexOf('{', at);
  let depth = 0;
  let end = open;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = source
    .slice(open + 1, end)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  const out = new Set();
  for (const m of body.matchAll(MEMBER)) out.add(m[1]);
  return out;
}

function readFolder(dir) {
  let files;
  try {
    files = readdirSync(dir);
  } catch {
    return '';
  }
  return files
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n');
}

export function auditPlatformProps() {
  let roots;
  try {
    roots = readdirSync(UI_SRC).filter((n) => statSync(join(UI_SRC, n)).isDirectory());
  } catch {
    // The component tree is the whole subject. Absent, this check proves nothing, and a
    // gate that cannot run must not report success — the lesson of ds:check, deleted the
    // same day for exactly this.
    return [
      {
        name: 'platform-props',
        line: 0,
        text: `(i) PLATFORM-LOCAL PROP  ${UI_SRC} does not exist — nothing was compared. This is a failure, not a pass.`,
      },
    ];
  }

  const findings = [];
  for (const name of roots.sort()) {
    const source = readFolder(join(UI_SRC, name));
    const web = ownProps(source, `Web${name}Props`);
    const native = ownProps(source, `Native${name}Props`);
    if (!web || !native) continue; // nothing to compare — reported by no check, see header

    const webOnly = [...web].filter((p) => !native.has(p) && !WEB_ONLY.includes(p)).sort();
    const nativeOnly = [...native].filter((p) => !web.has(p) && !WEB_ONLY.includes(p)).sort();
    if (!webOnly.length && !nativeOnly.length) continue;

    const parts = [];
    if (webOnly.length)
      parts.push(`web declares ${webOnly.map((p) => `\`${p}\``).join(', ')} and native does not`);
    if (nativeOnly.length)
      parts.push(
        `native declares ${nativeOnly.map((p) => `\`${p}\``).join(', ')} and web does not`,
      );
    findings.push({
      name,
      line: 0,
      text:
        `(i) PLATFORM-LOCAL PROP  ${name}: ${parts.join('; ')}. Law 7 — a prop on one platform ` +
        `only is a defect. Either give the other half the prop, or, if the platform genuinely ` +
        `has no equivalent, add the name to WEB_ONLY in platform-props.mjs and justify it in review.`,
    });
  }
  return findings;
}
