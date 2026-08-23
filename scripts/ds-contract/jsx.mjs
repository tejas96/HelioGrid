/**
 * SHARED JSX SCANNING — the text-level tag reader that checks (e), (f), (g) and (h) all stand on.
 *
 * WHY IT IS ITS OWN FILE. It was born inside native-a11y.mjs, where it served three checks that
 * happened to live in one module. That module then grew past the repo's 300-line law (CLAUDE.md
 * §8) — a gate that enforces the repo's rules while breaking one has no standing — and the split
 * had to be by RESPONSIBILITY, never `*-part2`. This is the responsibility that was hiding inside
 * it: "read a JSX opening tag out of TEXT". It knows nothing about accessibility.
 *
 * WHAT IT IS. A tolerant scanner, not a parser. There is no TypeScript program and no JSX parser
 * here for the reason lib.mjs gives: the gate must run in ~1s over ~850 files and must never need
 * a build to be correct. It understands strings, template literals, comments and brace nesting; it
 * understands nothing about regex literals or JSX type arguments. Every ambiguity resolves toward
 * UNDER-reporting, which is the trade the whole gate keeps — a gate that invents work gets muted,
 * and a muted gate catches nothing.
 */
import { comments, skipString } from './lib.mjs';

/** Every JSX opening tag with a Capitalised (component) name, dotted names included. */
export const ANY_TAG = /<\s*([A-Z][A-Za-z0-9_$]*(?:\.[A-Za-z0-9_$]+)*)\b/g;
/** An attribute name, and whether it was written with a value. */
export const ATTR = /([A-Za-z_$][A-Za-z0-9_$-]*)\s*(=?)/g;

const OPEN = '{([';
const CLOSE = '})]';

/** From the `<` of a tag, the text of its attribute list and where the tag ends. Strings and
 *  template literals are opaque, and everything nested inside `{}` / `()` / `[]` is depth > 0. */
function stepTag(source, i, state) {
  const ch = source[i];
  if (ch === '"' || ch === "'" || ch === '`') return skipString(source, i) - 1;
  if (OPEN.includes(ch)) {
    if (state.depth === 0) state.spans.push(source.slice(state.start, i));
    state.depth += 1;
  } else if (CLOSE.includes(ch)) {
    state.depth -= 1;
    if (state.depth === 0) state.start = i + 1;
  } else if (ch === '>' && state.depth === 0) state.close = i;
  return i;
}

/** `{ attrs, end, spread }` for the tag whose name ends at `from`, or null if it never closes.
 *  `attrs` is the attribute text with every `{…}` interior REMOVED, so a whole JSX element passed
 *  inside a brace cannot be mistaken for an attribute of this tag. */
export function openingTag(source, from) {
  const state = { depth: 0, spans: [], start: from, close: -1 };
  for (let i = from; i < source.length && state.close === -1; i += 1) {
    i = stepTag(source, i, state);
  }
  if (state.close === -1) return null;
  state.spans.push(source.slice(state.start, state.close));
  const inner = source.slice(from, state.close);
  return { attrs: state.spans.join(' '), end: state.close, spread: /\{\s*\.\.\./.test(inner) };
}

/** Attribute names written at the tag's own depth — `style={{ accessibilityLabel: … }}` never
 *  reaches here, and neither does a whole JSX element passed inside a brace. */
export function attributeNames(attrs) {
  const names = new Map();
  for (const match of [...attrs.matchAll(ATTR)]) names.set(match[1], match[2] === '=');
  return names;
}

/** String and template-literal bodies blanked, length preserved. `accessibilityLabel="not
 *  accessible"` must not read as the `accessible` prop, and `<Text>…"<Pressable>"…</Text>` copy
 *  must not read as a control. */
export function blankStrings(text) {
  const out = text.split('');
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== '"' && text[i] !== "'" && text[i] !== '`') continue;
    const end = skipString(text, i);
    for (let j = i + 1; j < end - 1 && j < text.length; j += 1) if (out[j] !== '\n') out[j] = ' ';
    i = end - 1;
  }
  return out.join('');
}

/** Comment bodies blanked in place, so positions and line numbers survive. A `<View` inside a
 *  worked example in a JSDoc block is prose, not a render. */
export function maskComments(source) {
  let out = source;
  for (const block of comments(source)) {
    const blank = block.text.replace(/[^\n]/g, ' ');
    out = out.slice(0, block.start) + blank + out.slice(block.start + block.text.length);
  }
  return out;
}

const escapeName = (name) => name.replace(/\./g, '\\.');

/** Index `i` sits on a `<`. Classify it against `name`: `close` (a matching `</name>`), `open` with
 *  the index to resume from and whether it opened a level, or `null` for some other tag. */
function tagStep(source, i, name, res) {
  const ahead = source.slice(i, i + name.length + 16);
  if (res.close.test(ahead)) return { close: true };
  const open = res.open.exec(ahead);
  if (!open) return null;
  const nested = openingTag(source, i + open[0].length);
  if (!nested) return { broken: true };
  return { resume: nested.end, opened: source[nested.end - 1] !== '/' };
}

/** One character of the subtree walk. Returns the index to resume from; `state` carries the depth,
 *  the answer once found, and whether the scan gave up. */
function stepSubtree(source, i, name, res, state) {
  const ch = source[i];
  if (ch === '"' || ch === "'" || ch === '`') return skipString(source, i) - 1;
  if (ch !== '<') return i;
  const step = tagStep(source, i, name, res);
  if (step === null) return i;
  if (step.broken) {
    state.broken = true;
    return i;
  }
  if (step.close) {
    state.depth -= 1;
    if (state.depth === 0) state.at = i;
    return i;
  }
  if (step.opened) state.depth += 1;
  return step.resume;
}

/** Index of the `<` that closes `<name …>` opened at `bodyStart`, or -1. Same-name nesting is
 *  counted and self-closing tags do not open a level; strings are opaque. */
export function subtreeEnd(source, name, bodyStart) {
  const res = {
    close: new RegExp(`^</\\s*${escapeName(name)}\\s*>`),
    open: new RegExp(`^<\\s*${escapeName(name)}(?![A-Za-z0-9_$.])`),
  };
  const state = { depth: 1, at: -1, broken: false };
  for (let i = bodyStart; i < source.length && state.at === -1 && !state.broken; i += 1) {
    i = stepSubtree(source, i, name, res, state);
  }
  return state.at;
}
