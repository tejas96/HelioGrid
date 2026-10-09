import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFiles, lineAt, newlinesOf } from './repo-files';

/**
 * Every colour `packages/ui` sets on a background is a pair `packages/theme/src/contrast.ts`
 * declares (`F7-11`, `N4`). The theme build holds each declared pair over its floor; this holds
 * the drawn pairs to the declared set, so a pair is measured only once it is declared.
 *
 * A pair is a CSS rule, or a native style object, that sets a background and a colour together:
 * `color` sets words, `fill` and `stroke` set marks. A colour whose background another rule or a
 * parent sets is NOT read — no static read knows where it lands — and neither are borders and
 * shadows. Ground's custom properties stand for every value `Ground.css` gives them. A value that
 * is not one colour token is a finding unless `NOT_ONE_COLOUR` names it with its reason. A native
 * colour is read only as `theme.colors…` inside an innermost object literal; a lookup, a variable
 * or a shorthand is not read.
 */
const UI_SOURCE = 'packages/ui/src';
const GROUND_CSS = 'packages/ui/src/primitives/Ground/Ground.css';
const DECLARED_PAIRS = 'packages/theme/dist/contrast.pairs.json';
const TOKENS = 'packages/theme/dist/tokens.json';

/**
 * A value no single colour measures, and who holds it instead, or that nothing does. A setting
 * that names one is not read; a name no setting uses any more is a finding, so the list cannot
 * outlive its reason.
 */
const NOT_ONE_COLOUR = new Map([
  ['hg-doc-brand', "the tenant's colour — T-FPLAT-022's engine checks it when it is saved"],
  ['hg-doc-band-text', "the ink chosen for the tenant's colour by the same engine"],
  ['tenant-mark', "the tenant's colour on its monogram — the same engine"],
  ['tenant-mark-on', "the ink chosen for the tenant's colour — the same engine"],
  ['gradient-brand', 'the wordmark — a logotype, which WCAG 1.4.3 exempts'],
  [
    'hg-icon-circle-color',
    "Card's icon circle: a tone the caller picks over a wash of itself — not held, review",
  ],
  [
    'hg-record-avatar-tone',
    "a record's avatar: a tone the caller picks over a wash of itself — not held, review",
  ],
]);

const BACKGROUNDS = new Set(['background', 'background-color', 'backgroundColor']);
const COLOURS = new Set(['color', 'fill', 'stroke']);
/** A keyword sets no colour of its own: the colour or background beneath shows through. */
const NO_COLOUR = /^(transparent|none|inherit|currentcolor|initial|unset)$/i;
const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
const CSS_RULE = /[^{}]+\{([^{}]*)\}/g;
const CSS_DECLARATION = /([\w-]+)\s*:\s*([^;]+)/g;
const CSS_TOKEN = /^var\(--([\w-]+)\)$/;
const OBJECT_BODY = /\{([^{}]*)\}/g;
const NATIVE_PROPERTY = /\b(color|fill|stroke|backgroundColor|background)\s*:\s*([^,\n]+)/g;
const NATIVE_TOKEN = /theme\.colors(?:\.([\w]+)|\[\s*['"]([\w-]+)['"]\s*\])/g;

interface Setting {
  property: string;
  /** The tokens the value may take; empty when it reads as no colour of its own. */
  tokens: string[];
  /** The value as written, when it is not one token. */
  unreadable?: string;
  line: number;
}

function readJson(repo: string, file: string): unknown {
  const path = join(repo, file);
  if (!existsSync(path)) throw new Error(`ui-colour-pairs: ${file} missing — build packages/theme`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function declaredPairs(repo: string): Set<string> {
  const { pairs } = readJson(repo, DECLARED_PAIRS) as { pairs: { fg: string; bg: string }[] };
  return new Set(pairs.map(({ fg, bg }) => `${fg} on ${bg}`));
}

/** Each token whose value is one hex colour — the theme build writes every alias resolved. */
function colourTokens(repo: string): Set<string> {
  const tokens = readJson(repo, TOKENS) as Record<string, unknown>;
  return new Set(
    Object.entries(tokens)
      .filter(([key, value]) => key.startsWith('--') && /^#[0-9a-f]{3,8}$/i.test(String(value)))
      .map(([key]) => key.slice(2)),
  );
}

/** `--hg-ground` and its siblings, each with every value `Ground.css` gives it. */
function groundValues(repo: string): Map<string, string[]> {
  const css = readFileSync(join(repo, GROUND_CSS), 'utf8').replace(CSS_COMMENT, '');
  const grounds = new Map<string, string[]>();
  for (const [, name, token] of css.matchAll(/--(hg-[\w-]+)\s*:\s*var\(--([\w-]+)\)/g)) {
    const values = grounds.get(name ?? '') ?? [];
    if (!values.includes(token ?? '')) values.push(token ?? '');
    grounds.set(name ?? '', values);
  }
  if (!grounds.has('hg-ground'))
    throw new Error(`ui-colour-pairs: ${GROUND_CSS} sets no --hg-ground`);
  return grounds;
}

function namesUnmeasured(value: string, used: Set<string>): boolean {
  const named = [...NOT_ONE_COLOUR.keys()].filter((name) =>
    new RegExp(`(--|')${name}(?![\\w-])`).test(value),
  );
  for (const name of named) used.add(name);
  return named.length > 0;
}

function cssSetting(property: string, raw: string, line: number, used: Set<string>): Setting {
  const value = raw.trim();
  if (NO_COLOUR.test(value) || namesUnmeasured(value, used)) return { property, tokens: [], line };
  const token = CSS_TOKEN.exec(value)?.[1];
  return token
    ? { property, tokens: [token], line }
    : { property, tokens: [], unreadable: value, line };
}

/** Each CSS rule's colour and background settings, comments blanked so lines hold. */
function cssRules(text: string, used: Set<string>): Setting[][] {
  const css = text.replace(CSS_COMMENT, newlinesOf);
  return [...css.matchAll(CSS_RULE)].map((rule) => {
    const bodyAt = (rule.index ?? 0) + rule[0].indexOf('{') + 1;
    return [...(rule[1] ?? '').matchAll(CSS_DECLARATION)]
      .filter(([, property]) => BACKGROUNDS.has(property ?? '') || COLOURS.has(property ?? ''))
      .map((declaration) =>
        cssSetting(
          declaration[1] ?? '',
          declaration[2] ?? '',
          lineAt(css, bodyAt + (declaration.index ?? 0)),
          used,
        ),
      );
  });
}

/** Each innermost object literal's settings that name `theme.colors`; any other value is not read. */
function nativeObjects(text: string, used: Set<string>): Setting[][] {
  return [...text.matchAll(OBJECT_BODY)].map((object) => {
    const bodyAt = (object.index ?? 0) + 1;
    return [...(object[1] ?? '').matchAll(NATIVE_PROPERTY)]
      .filter((property) => !namesUnmeasured(property[2] ?? '', used))
      .map((property) => ({
        property: property[1] ?? '',
        tokens: [...(property[2] ?? '').matchAll(NATIVE_TOKEN)].map((m) => m[1] ?? m[2] ?? ''),
        line: lineAt(text, bodyAt + (property.index ?? 0)),
      }))
      .filter((setting) => setting.tokens.length > 0);
  });
}

/** What a drawn pair is judged against: the declared set, the colour tokens, the grounds. */
interface Palette {
  declared: Set<string>;
  colours: Set<string>;
  expand: (token: string) => string[];
}

function pairFinding(
  where: string,
  property: string,
  fg: string,
  bg: string,
  palette: Palette,
): string | null {
  const unknown = [fg, bg].filter((token) => !palette.colours.has(token));
  if (unknown.length > 0) return `${where}: --${unknown.join(', --')} is not one colour token`;
  if (palette.declared.has(`${fg} on ${bg}`)) return null;
  return `${where}: ${property} --${fg} on --${bg} is not a declared pair`;
}

/** One rule's or object's findings: a colour set beside no background is not a pair. */
function judgeGroup(
  file: string,
  settings: Setting[],
  palette: Palette,
): { findings: string[]; pairs: number } {
  const backgrounds = settings.filter((setting) => BACKGROUNDS.has(setting.property));
  const colourSettings = settings.filter((setting) => COLOURS.has(setting.property));
  if (backgrounds.length === 0 || colourSettings.length === 0) return { findings: [], pairs: 0 };
  const findings = [...backgrounds, ...colourSettings]
    .filter((setting) => setting.unreadable)
    .map(
      (setting) =>
        `${file}:${setting.line}: ${setting.property} \`${setting.unreadable}\` is not one colour token`,
    );
  const backgroundTokens = backgrounds.flatMap((setting) => setting.tokens.flatMap(palette.expand));
  let pairs = 0;
  for (const setting of colourSettings) {
    for (const fg of setting.tokens.flatMap(palette.expand)) {
      for (const bg of backgroundTokens) {
        pairs += 1;
        const finding = pairFinding(`${file}:${setting.line}`, setting.property, fg, bg, palette);
        if (finding) findings.push(finding);
      }
    }
  }
  return { findings, pairs };
}

export function findUndeclaredColourPairs(repo: string): {
  findings: string[];
  pairs: number;
  files: number;
} {
  const grounds = groundValues(repo);
  const palette: Palette = {
    declared: declaredPairs(repo),
    colours: colourTokens(repo),
    expand: (token) => grounds.get(token) ?? [token],
  };
  const files = gitFiles(repo, [UI_SOURCE]).filter(
    (file) => /\.(css|tsx?)$/.test(file) && file !== GROUND_CSS,
  );
  if (files.length === 0) throw new Error(`ui-colour-pairs: no style files under ${UI_SOURCE}`);
  const findings: string[] = [];
  const used = new Set<string>();
  let pairs = 0;
  for (const file of files) {
    const text = readFileSync(join(repo, file), 'utf8');
    const groups = file.endsWith('.css') ? cssRules(text, used) : nativeObjects(text, used);
    for (const settings of groups) {
      const judged = judgeGroup(file, settings, palette);
      findings.push(...judged.findings);
      pairs += judged.pairs;
    }
  }
  if (pairs === 0) throw new Error('ui-colour-pairs: read no colour pair — the reader is broken');
  for (const name of NOT_ONE_COLOUR.keys()) {
    if (!used.has(name))
      findings.push(`NOT_ONE_COLOUR names --${name}, which no ui colour or background uses`);
  }
  return { findings: [...new Set(findings)], pairs, files: files.length };
}

export function runUiColourPairs(repo: string): void {
  const { findings, pairs, files } = findUndeclaredColourPairs(repo);
  if (findings.length > 0) {
    throw new Error(
      'ui-colour-pairs: declare each pair in packages/theme/src/contrast.ts with its role and floor, ' +
        `or draw a declared one:\n  ${findings.join('\n  ')}`,
    );
  }
  console.log(
    `ui-colour-pairs OK — ${pairs} colour pairs across ${files} ui files, every one declared`,
  );
}
