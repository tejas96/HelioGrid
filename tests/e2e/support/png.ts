import { deflateSync } from 'node:zlib';

/**
 * A real PNG of the given size, built here so no image file is committed: a browser decodes it and
 * reads its width, which is what the logo's check needs. Stored unpacked, so its byte size is its
 * pixels' — three bytes each — and a test picks a size by picking a height.
 */
export function pngOf(width: number, height: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  // Eight bits a channel, truecolour, and the format's only compression, filter and interlace.
  header.set([8, 2, 0, 0, 0], 8);
  const rowBytes = 1 + width * 3;
  const pixels = Buffer.alloc(rowBytes * height, 0x7f);
  for (let row = 0; row < height; row += 1) pixels[row * rowBytes] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels, { level: 0 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
