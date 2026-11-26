const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Bytes as canonical base64 — the spare bits of the last character are zero. Written here because
 * the phone's engine and this package's own build name no encoder both can call.
 */
export function base64Of(bytes: Uint8Array): string {
  let encoded = '';
  for (let at = 0; at < bytes.length; at += 3) {
    const [first = 0, second, third] = bytes.subarray(at, at + 3);
    const triple = (first << 16) | ((second ?? 0) << 8) | (third ?? 0);
    encoded += BASE64.charAt(triple >> 18) + BASE64.charAt((triple >> 12) & 63);
    encoded += second === undefined ? '=' : BASE64.charAt((triple >> 6) & 63);
    encoded += third === undefined ? '=' : BASE64.charAt(triple & 63);
  }
  return encoded;
}

/** The bytes a base64 text holds, as a phone's picker hands a file over. */
export function bytesOfBase64(base64: string): Uint8Array {
  const letters = base64.replace(/=+$/, '');
  const bytes = new Uint8Array(Math.floor((letters.length * 3) / 4));
  let held = 0;
  let bits = 0;
  let at = 0;
  for (const letter of letters) {
    held = ((held << 6) | BASE64.indexOf(letter)) & 0xffff;
    bits += 6;
    if (bits < 8) continue;
    bits -= 8;
    bytes[at] = (held >> bits) & 0xff;
    at += 1;
  }
  return bytes;
}
