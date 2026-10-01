import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFiles, lineAt, newlinesOf } from './repo-files';

/**
 * v1 is light-only, on the platform files no lint plugin reads.
 *
 * The web page declares `color-scheme: only light`, so the browser never darkens it; iOS pins the
 * interface style to Light; every Android theme has a Light parent, never one that follows the
 * system (DayNight), and refuses forced dark; and the design system's semantic aliases are each a
 * var() chain, which is what keeps a later dark set one block of values rather than a rewrite.
 * The XML is read as text — a comment can never be a declaration, so comments are blanked first.
 */
const GLOBALS_CSS = 'apps/web/app/globals.css';
const INFO_PLIST = 'apps/mobile/ios/HelioGridMobile/Info.plist';
const ANDROID_STYLES = 'apps/mobile/android/app/src/main/res/values*/styles.xml';
const COLORS_CSS = 'packages/theme/src/_generated/tokens/colors.css';

const XML_COMMENT = /<!--[\s\S]*?-->/g;
const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

const decode = (text: string) =>
  text.replace(/&(amp|lt|gt|quot|apos);/g, (entity, name: string) => ENTITIES[name] ?? entity);
const withoutXmlComments = (text: string) => text.replace(XML_COMMENT, newlinesOf);

function attributes(tag: string): Map<string, string> {
  const pairs = tag.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g);
  return new Map([...pairs].map((m) => [m[1] ?? '', decode(m[2] ?? m[3] ?? '')]));
}

function read(repo: string, file: string): string | null {
  const path = join(repo, file);
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

function webPageProblems(repo: string): string[] {
  const css = read(repo, GLOBALS_CSS);
  if (css === null) return [`${GLOBALS_CSS}: missing — nothing declares the page light-only`];
  const declared = /:root\s*\{[^}]*color-scheme\s*:\s*only\s+light/.test(
    css.replace(CSS_COMMENT, ''),
  );
  return declared ? [] : [`${GLOBALS_CSS}: :root does not declare \`color-scheme: only light\``];
}

/** Each key of the plist's ROOT dict, with where its value starts — a nested dict's keys are not. */
function rootKeys(text: string): { key: string; valueAt: number }[] {
  const keys: { key: string; valueAt: number }[] = [];
  let depth = 0;
  for (const tag of text.matchAll(/<(\/?)(\w+)[^>]*?(\/?)>/g)) {
    const [whole, closing, name, selfClosing] = tag;
    if ((name === 'dict' || name === 'array') && !selfClosing) depth += closing ? -1 : 1;
    if (name !== 'key' || closing || depth !== 1) continue;
    const keyEnd = text.indexOf('</key>', tag.index);
    const key = decode(text.slice(tag.index + whole.length, keyEnd).trim());
    keys.push({ key, valueAt: keyEnd + '</key>'.length });
  }
  return keys;
}

/** The string value of a key in the plist's root dict, or null when it is absent or not a string. */
function rootPlistString(plist: string, wanted: string): string | null {
  const text = withoutXmlComments(plist);
  const valueAt = rootKeys(text).find(({ key }) => key === wanted)?.valueAt;
  if (valueAt === undefined) return null;
  const value = /^\s*<string>([^<]*)<\/string>/.exec(text.slice(valueAt));
  return value ? decode(value[1] ?? '') : null;
}

function iosProblems(repo: string): string[] {
  const plist = read(repo, INFO_PLIST);
  if (plist === null) return [`${INFO_PLIST}: missing — nothing pins the interface style`];
  const style = rootPlistString(plist, 'UIUserInterfaceStyle');
  return style === 'Light' ? [] : [`${INFO_PLIST}: UIUserInterfaceStyle is not Light`];
}

function androidStyleProblems(file: string, xml: string): string[] {
  const text = withoutXmlComments(xml);
  const problems: string[] = [];
  for (const style of text.matchAll(/<style\b([^>]*?)(\/?)>/g)) {
    const attrs = attributes(style[1] ?? '');
    const name = attrs.get('name');
    const parent = attrs.get('parent') ?? '';
    const at = `${file}:${lineAt(text, style.index)}`;
    const bodyEnd = style[2] ? style.index : text.indexOf('</style>', style.index);
    const body = text.slice(style.index, bodyEnd === -1 ? text.length : bodyEnd);
    if (parent.includes('DayNight')) {
      problems.push(`${at}: style ${name} follows the system (DayNight)`);
    } else if (name === 'AppTheme' && !parent.includes('Light')) {
      problems.push(`${at}: style AppTheme's parent '${parent}' is not a Light theme`);
    }
    const optedOut = [...body.matchAll(/<item\b([^>]*)>([\s\S]*?)<\/item>/g)].some(
      (item) =>
        attributes(item[1] ?? '').get('name') === 'android:forceDarkAllowed' &&
        decode(item[2] ?? '').trim() === 'false',
    );
    if (name === 'AppTheme' && !optedOut) {
      problems.push(`${at}: style AppTheme does not set android:forceDarkAllowed to false`);
    }
  }
  return problems;
}

function androidProblems(repo: string): { problems: string[]; files: number } {
  const files = gitFiles(repo, [ANDROID_STYLES]);
  if (files.length === 0)
    return { problems: [`${ANDROID_STYLES}: none tracked — nothing to read`], files: 0 };
  return {
    problems: files.flatMap((file) => androidStyleProblems(file, read(repo, file) ?? '')),
    files: files.length,
  };
}

function aliasProblems(repo: string): string[] {
  const palette = read(repo, COLORS_CSS);
  if (palette === null) return [`${COLORS_CSS}: missing — no semantic alias block`];
  const start = palette.indexOf('Semantic aliases');
  if (start === -1) return [`${COLORS_CSS}: no semantic alias block`];
  const block = palette.slice(start, palette.indexOf('}', start)).replace(CSS_COMMENT, newlinesOf);
  const aliases = [...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)];
  if (aliases.length === 0) return [`${COLORS_CSS}: no semantic alias block`];
  return aliases
    .filter((alias) => !(alias[2] ?? '').trim().startsWith('var('))
    .map((alias) => {
      const line = lineAt(palette, start + alias.index);
      return `${COLORS_CSS}:${line}: alias ${alias[1]} is \`${(alias[2] ?? '').trim()}\`, not a var() chain`;
    });
}

function scanLightOnlyPlatformFiles(repo: string): { findings: string[]; androidFiles: number } {
  const android = androidProblems(repo);
  const findings = [
    ...webPageProblems(repo),
    ...iosProblems(repo),
    ...android.problems,
    ...aliasProblems(repo),
  ];
  return { findings, androidFiles: android.files };
}

export function findDarkModeOnPlatformFiles(repo: string): string[] {
  return scanLightOnlyPlatformFiles(repo).findings;
}

export function runLightOnlyPlatformFiles(repo: string): void {
  const { findings, androidFiles } = scanLightOnlyPlatformFiles(repo);
  if (findings.length > 0) {
    throw new Error(`light-only-platform-files: v1 is light-only:\n  ${findings.join('\n  ')}`);
  }
  console.log(
    `light-only-platform-files OK — web :root, iOS Info.plist, ${androidFiles} Android themes ` +
      'and the semantic aliases all hold light-only',
  );
}
