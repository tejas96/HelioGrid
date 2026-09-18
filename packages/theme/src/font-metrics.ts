/**
 * What the bundled faces themselves say — read at build time, never transcribed (`F3-13`,
 * `F3-14`, `F3-17`).
 *
 * The brand face has no Devanagari; a browser resolves that per character from the stack and
 * React Native cannot. So the stack's coverage, its order and the room each face needs are
 * emitted as data, and both platform halves resolve one line from the same answer (Law 7).
 *
 * fontkit reads tables here; it never SHAPES text — shaping is the document renderer's, and
 * `docs/engineering/03-tech-stack.md` keeps the two apart.
 */
import * as fontkit from 'fontkit';

/** One bundled family: what it draws, the room it needs, and the weights it ships. */
export interface BundledFace {
  readonly family: string;
  /** Inclusive codepoint ranges the family's character map covers. */
  readonly ranges: readonly (readonly [number, number])[];
  /**
   * The line box this face needs, in em, or 0 for the face the type scale was drawn against.
   *
   * `F3-17` — the scale keeps its sizes and takes a per-script line height. The brand face
   * DEFINES the scale's boxes, so it imposes no floor; every other bundled face must fit its own
   * metrics inside them, and the face's own ascent-plus-descent is its statement of that. Read
   * from the face rather than its glyphs on purpose: a rare mark the product never draws — a
   * Vedic cantillation sign, a stacked Vietnamese accent — would otherwise set the room for
   * every heading in the product.
   */
  readonly lineFloorEm: number;
  /** The weights the face's own variation axis reaches, so none is synthesized. */
  readonly weights: readonly [number, number];
}

/** Consecutive codepoints collapsed into inclusive ranges. */
function toRanges(codePoints: readonly number[]): (readonly [number, number])[] {
  const sorted = [...codePoints].sort((a, b) => a - b);
  const ranges: [number, number][] = [];
  for (const codePoint of sorted) {
    const last = ranges.at(-1);
    if (last && codePoint === last[1] + 1) last[1] = codePoint;
    else ranges.push([codePoint, codePoint]);
  }
  return ranges;
}

/**
 * The bundled faces, in the order the stack names them.
 *
 * `families` is the stack's own order and decides priority: a face named ahead of another takes
 * every codepoint they share, exactly as a browser walks a font stack. Adding a language in a new
 * script is then bundling its face and naming it in the stack — no code change (`F3-26`, `F3-28`).
 */
export function readBundledFaces(
  families: readonly string[],
  fileByFamily: ReadonlyMap<string, string>,
): BundledFace[] {
  const bundled = families.filter((family) => fileByFamily.has(family));
  if (bundled.length === 0) throw new Error('the font stack names no bundled family');

  return bundled.map((family, position) => {
    const file = fileByFamily.get(family) as string;
    const font = fontkit.openSync(file);
    if (!('familyName' in font)) throw new Error(`${file} is a font collection, not one face`);
    if (font.familyName !== family) {
      throw new Error(`${family} is named in the stack but its file reads ${font.familyName}`);
    }
    const axis = font.variationAxes.wght;
    if (axis === undefined) {
      throw new Error(
        `${family} declares no weight axis, so the platform would synthesize every weight but its own (F3-14)`,
      );
    }
    const line = (font.ascent - font.descent + font.lineGap) / font.unitsPerEm;
    return {
      family,
      ranges: toRanges(font.characterSet),
      lineFloorEm: position === 0 ? 0 : Math.round(line * 1000) / 1000,
      weights: [axis.min, axis.max],
    };
  });
}

/**
 * `F3-14` — a weight the interface uses and a face does not ship is SYNTHESIZED by the platform,
 * which distorts a script's strokes and matras. The build refuses rather than ship that.
 */
export function assertWeightsShipped(faces: readonly BundledFace[], sanctioned: readonly number[]) {
  for (const face of faces) {
    const [low, high] = face.weights;
    const missing = sanctioned.filter((weight) => weight < low || weight > high);
    if (missing.length > 0) {
      throw new Error(
        `${face.family} ships weights ${low}–${high}; the design language sanctions ` +
          `${missing.join(', ')}, which the platform would synthesize (F3-14)`,
      );
    }
  }
}
