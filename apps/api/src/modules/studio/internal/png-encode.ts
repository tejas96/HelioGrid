import { crc32, deflateSync } from 'node:zlib';

/**
 * A picture's red, green and blue bytes as a PNG (`T-M05-002`, part g: the straight-down picture),
 * written with Node's own zlib: eight bits a channel, no alpha, each row with no filter.
 */
/** PNG's eight-byte signature, as its spec writes it. */
const SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const RGB = 3;
const BIT_DEPTH = 8;
const COLOUR_TRUECOLOUR = 2;
const HEADER_BYTES = 13;
const FOUR = 4;

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(FOUR);
  length.writeUInt32BE(data.length);
  const named = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const check = Buffer.alloc(FOUR);
  check.writeUInt32BE(crc32(named));
  return Buffer.concat([length, named, check]);
}

/** `rgb` row by row from the top, three bytes a pixel. */
export function pngOf(width: number, height: number, rgb: Uint8Array): Buffer {
  const header = Buffer.alloc(HEADER_BYTES);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, FOUR);
  header[2 * FOUR] = BIT_DEPTH;
  header[2 * FOUR + 1] = COLOUR_TRUECOLOUR;
  const rows = Buffer.alloc((width * RGB + 1) * height);
  for (let row = 0; row < height; row += 1) {
    const at = row * (width * RGB + 1);
    rows[at] = 0;
    rows.set(rgb.subarray(row * width * RGB, (row + 1) * width * RGB), at + 1);
  }
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
