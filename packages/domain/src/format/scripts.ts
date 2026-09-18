/**
 * Which bundled face draws which run of a line (`F3-09`, `F3-13`).
 *
 * A browser resolves a font stack per character and needs none of this. React Native gives one
 * `fontFamily` to a whole `Text`, so the runs are resolved explicitly there — and this is the
 * ONE resolution, so the phone reaches the answer the browser already reaches (Law 7).
 *
 * The coverage and its order are FACTS OF THE BUNDLED FILES, read in `packages/theme`'s build
 * from each face's own character map and the design system's stack order; nothing here knows a
 * family name or a codepoint range. Adding a face is then a design-system change and no code
 * change (`F3-26`, `F3-28`).
 */

/** One bundled family and the codepoints it draws. Both ends of a range are inclusive. */
export interface FamilyCoverage {
  readonly family: string;
  readonly ranges: readonly (readonly [number, number])[];
}

/**
 * The bundled families in the order the design system's stack names them, brand face first.
 * Non-empty by construction: a product with no bundled face has nothing to draw with, and the
 * build refuses to emit one.
 */
export type ScriptStack = readonly [FamilyCoverage, ...FamilyCoverage[]];

/** A stretch of a line drawn by one family. */
export interface ScriptRun {
  readonly text: string;
  readonly family: string;
}

function covers(coverage: FamilyCoverage, codePoint: number): boolean {
  return coverage.ranges.some(([from, to]) => codePoint >= from && codePoint <= to);
}

/**
 * The line, split into the fewest runs that give every character a face that draws it.
 *
 * The runs put the line back exactly as it came — never a character dropped, reordered or
 * substituted, which is what `F3-09` forbids working around. A character NO bundled face covers
 * stays in the run beside it: a joiner decides whether two consonants draw as one conjunct, and
 * a run cut at it breaks the conjunct.
 */
export function splitScriptRuns(text: string, stack: ScriptStack): readonly ScriptRun[] {
  const runs: ScriptRun[] = [];
  let family = '';
  let run = '';

  /* The string iterator yields whole code points, surrogate pairs included, so a character
     here is never empty and always has one. */
  for (const character of text) {
    const codePoint = character.codePointAt(0) as number;
    const drawnBy = stack.find((coverage) => covers(coverage, codePoint));
    const next = drawnBy?.family ?? (family === '' ? stack[0].family : family);
    if (next !== family && run !== '') {
      runs.push({ text: run, family });
      run = '';
    }
    family = next;
    run += character;
  }

  if (run !== '') runs.push({ text: run, family });
  return runs;
}
