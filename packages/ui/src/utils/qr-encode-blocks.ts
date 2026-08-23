/* qr-encode — the version tables, the GF(256) arithmetic, the Reed-Solomon coder, the
   codeword/interleave stage and the UTF-8 payload encoder. Everything that turns a payload into
   codewords lives here; the module grid and its function patterns are in qr-encode-grid.ts and
   the public entry point is `encodeQR` in qr-encode.ts.
   Behaviour is the design system's, exactly. */

export interface EcConfig {
  total: number;
  ecPerBlock: number;
  blocks: number[];
}

export const EC: Record<number, EcConfig> = {
  1: { total: 26, ecPerBlock: 10, blocks: [16] },
  2: { total: 44, ecPerBlock: 16, blocks: [28] },
  3: { total: 70, ecPerBlock: 26, blocks: [44] },
  4: { total: 100, ecPerBlock: 18, blocks: [32, 32] },
  5: { total: 134, ecPerBlock: 24, blocks: [43, 43] },
  6: { total: 172, ecPerBlock: 16, blocks: [27, 27, 27, 27] },
  /* v7+ carry a version-information block as well as the format block. The ceiling is 10
     because a tokenised proposal URL on a tenant domain routinely runs past 100 characters —
     failing visibly is right for a genuinely oversized payload, not for an ordinary link. */
  7: { total: 196, ecPerBlock: 18, blocks: [31, 31, 31, 31] },
  8: { total: 242, ecPerBlock: 22, blocks: [38, 38, 39, 39] },
  9: { total: 292, ecPerBlock: 22, blocks: [36, 36, 36, 37, 37] },
  10: { total: 346, ecPerBlock: 26, blocks: [43, 43, 43, 43, 44] },
};

export const ALIGN: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

export const REMAINDER: Record<number, number> = {
  1: 0,
  2: 7,
  3: 7,
  4: 7,
  5: 7,
  6: 7,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
};

const EXP: number[] = new Array<number>(512).fill(0);
const LOG: number[] = new Array<number>(256).fill(0);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    EXP[i] = EXP[i - 255] ?? 0;
  }
})();

const exp = (i: number): number => EXP[i] ?? 0;
const log = (i: number): number => LOG[i] ?? 0;
const mul = (a: number, b: number): number => (a === 0 || b === 0 ? 0 : exp(log(a) + log(b)));

function rsGenerator(n: number): number[] {
  let poly: number[] = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] = (next[j] ?? 0) ^ mul(poly[j] ?? 0, exp(i));
      next[j + 1] = (next[j + 1] ?? 0) ^ (poly[j] ?? 0);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGenerator(ecLen);
  const res = new Array<number>(ecLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ (res[0] ?? 0);
    res.shift();
    res.push(0);
    for (let i = 0; i < ecLen; i++) {
      res[i] = (res[i] ?? 0) ^ mul(gen[i + 1] ?? 0, factor);
    }
  }
  return res;
}

/** The bit stream for one payload: mode 0100, 8/16-bit length, payload, terminator, pad bytes. */
export function codewords(bytes: number[], version: number, dataCw: number): number[] {
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };
  const lenBits = version < 10 ? 8 : 16;
  push(0b0100, 4);
  push(bytes.length, lenBits);
  for (const b of bytes) {
    push(b, 8);
  }
  for (let i = 0; i < 4 && bits.length < dataCw * 8; i++) {
    bits.push(0);
  }
  while (bits.length % 8) {
    bits.push(0);
  }
  const cw: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    cw.push(Number.parseInt(bits.slice(i, i + 8).join(''), 2));
  }
  const PAD = [0xec, 0x11];
  for (let i = 0; cw.length < dataCw; i++) {
    cw.push(PAD[i % 2] ?? 0);
  }
  return cw;
}

/** Split into blocks, RS-encode each, then interleave data then EC. */
export function interleave(cw: number[], cfg: EcConfig): number[] {
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let at = 0;
  for (const n of cfg.blocks) {
    const blk = cw.slice(at, at + n);
    at += n;
    dataBlocks.push(blk);
    ecBlocks.push(rsEncode(blk, cfg.ecPerBlock));
  }
  const final: number[] = [];
  const maxData = Math.max(...cfg.blocks);
  for (let i = 0; i < maxData; i++) {
    for (const b of dataBlocks) {
      if (i < b.length) {
        final.push(b[i] ?? 0);
      }
    }
  }
  for (let i = 0; i < cfg.ecPerBlock; i++) {
    for (const b of ecBlocks) {
      final.push(b[i] ?? 0);
    }
  }
  return final;
}

/** The code point starting at `i` and how many UTF-16 units it spans. An unpaired surrogate —
    high with no low after it, or a stray low — is U+FFFD, exactly as TextEncoder resolves it. */
function codePointFrom(text: string, i: number): { cp: number; units: number } {
  const cp = text.charCodeAt(i);
  if (cp >= 0xd800 && cp <= 0xdbff) {
    const low = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;
    if (low >= 0xdc00 && low <= 0xdfff) {
      return { cp: 0x10000 + ((cp - 0xd800) << 10) + (low - 0xdc00), units: 2 };
    }
    return { cp: 0xfffd, units: 1 };
  }
  if (cp >= 0xdc00 && cp <= 0xdfff) {
    return { cp: 0xfffd, units: 1 };
  }
  return { cp, units: 1 };
}

/** One code point as its 1–4 UTF-8 bytes. */
function utf8Of(cp: number): number[] {
  if (cp < 0x80) {
    return [cp];
  }
  if (cp < 0x800) {
    return [0xc0 | (cp >> 6), 0x80 | (cp & 0x3f)];
  }
  if (cp < 0x10000) {
    return [0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f)];
  }
  return [
    0xf0 | (cp >> 18),
    0x80 | ((cp >> 12) & 0x3f),
    0x80 | ((cp >> 6) & 0x3f),
    0x80 | (cp & 0x3f),
  ];
}

/* UTF-8 bytes, written out rather than taken from `TextEncoder`: the RN half compiles with no DOM
   lib and Hermes does not guarantee the global. Same output, unpaired surrogates included — they
   become U+FFFD, exactly as TextEncoder does. */
export function utf8Bytes(text: string): number[] {
  const out: number[] = [];
  let i = 0;
  while (i < text.length) {
    const { cp, units } = codePointFrom(text, i);
    out.push(...utf8Of(cp));
    i += units;
  }
  return out;
}
