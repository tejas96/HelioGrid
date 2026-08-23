/**
 * Shared plumbing for the three ds:contract checks. Plain node, zero deps, no `process.env`.
 *
 * Every check here reads TEXT. There is no TypeScript program and no JSX parser, because the gate
 * must run in ~1s on 847 files and must never need a build to be correct. The scanners below are
 * therefore tolerant rather than exact: they know about strings, template literals and comments,
 * and they know nothing about regex literals or JSX type arguments. Where that costs precision the
 * calling check resolves toward UNDER-reporting, for the reason ds-contract's own header gives —
 * a gate that invents work gets muted, and a muted gate catches nothing.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '../..');
export const UI_SRC = join(ROOT, 'packages/ui/src');
export const UI = join(UI_SRC, 'components');
export const ADHERENCE = join(ROOT, 'packages/theme/src/_generated/adherence.oxlintrc.json');
export const DEFAULT_CONTRACTS = join(ROOT, 'packages/theme/src/_generated/contracts');

export const byName = (a, b) => a.localeCompare(b);
export const rel = (path) => path.replace(`${ROOT}/`, '');
/** Comment bodies removed. Only safe on type text — use `comments()` when position matters. */
export const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
export const mentions = (text, names) =>
  [...names].some((n) => new RegExp(`\\b${n}\\b`).test(text));

export function walkFiles(dir, test, into = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkFiles(full, test, into);
    else if (test(entry)) into.push(full);
  }
  return into;
}

/** Every TypeScript source under `dir`, as `{ file, source }`, sorted so output is stable. */
export function sources(dir) {
  if (!existsSync(dir)) return [];
  return walkFiles(dir, (name) => /\.tsx?$/.test(name))
    .sort(byName)
    .map((file) => ({ file, source: readFileSync(file, 'utf8') }));
}

/** The `components/<Name>` folder a file belongs to, or null for primitives / utils / index. */
export function componentOf(file) {
  if (!file.startsWith(`${UI}/`)) return null;
  return file.slice(UI.length + 1).split('/')[0] ?? null;
}

/** Index `i` sits on a quote; return the index just past that string. Escapes honoured; a template
 *  literal is opaque, so `${…}` interiors are skipped wholesale rather than re-entered. */
export function skipString(src, i) {
  const quote = src[i];
  for (let j = i + 1; j < src.length; j += 1) {
    if (src[j] === '\\') {
      j += 1;
      continue;
    }
    if (src[j] === quote) return j + 1;
    if (quote !== '`' && src[j] === '\n') return j;
  }
  return src.length;
}

/** Every comment in `source` as `{ start, text }`, strings excluded so a `//` inside a URL literal
 *  is not read as prose. Consecutive `//` lines merge into ONE block: an excuse is written as a
 *  paragraph, and the name it hides behind is usually on a different line from the phrasing. */
export function comments(source) {
  const blocks = [];
  for (const item of rawComments(source)) {
    const last = blocks.at(-1);
    const gap = last ? source.slice(last.start + last.text.length, item.start) : '';
    const adjacent = last?.line && item.line && /^\s*$/.test(gap) && gap.split('\n').length === 2;
    if (adjacent) last.text = `${last.text}${gap}${item.text}`;
    else blocks.push({ ...item });
  }
  return blocks;
}

/** At `i`: a string to skip past, a comment to capture, or neither (`null` — advance one char). */
function tokenAt(source, i) {
  const ch = source[i];
  if (ch === '"' || ch === "'" || ch === '`') return { next: skipString(source, i) };
  if (ch !== '/') return null;
  if (source[i + 1] === '*') {
    const end = source.indexOf('*/', i + 2);
    const next = end === -1 ? source.length : end + 2;
    return { next, comment: { start: i, text: source.slice(i, next), line: false } };
  }
  if (source[i + 1] !== '/') return null;
  const nl = source.indexOf('\n', i);
  const next = nl === -1 ? source.length : nl;
  return { next, comment: { start: i, text: source.slice(i, next), line: true } };
}

function rawComments(source) {
  const raw = [];
  for (let i = 0; i < source.length; i += 1) {
    const token = tokenAt(source, i);
    if (token === null) continue;
    if (token.comment) raw.push(token.comment);
    i = token.next - 1;
  }
  return raw;
}

/** 1-based line number of `index` in `source`. */
export function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}

export function tally(exemptions, key, detail) {
  if (!exemptions.has(key)) exemptions.set(key, { count: 0, details: new Set() });
  const entry = exemptions.get(key);
  entry.count += 1;
  if (detail) entry.details.add(detail);
}
