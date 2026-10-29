/**
 * The `QRCode`'s own words (`packages/ui`'s `QRCodeProps`): its accessible name, which names the
 * destination, and what a code that cannot be drawn says instead (`MS9-14`, `MS9-24`).
 */
import type { Translator } from '../runtime';

const QR_CODE = {
  label: /*i18n*/ { id: 'QR code for {value}' },
  unavailable: /*i18n*/ { id: 'QR code unavailable' },
  tooLong: /*i18n*/ { id: 'This link is too long to encode. Use the link below instead.' },
  noLink: /*i18n*/ { id: 'No link to encode yet.' },
} as const;

/**
 * The code's words for one link, spread onto `QRCode` — `value` is the link it encodes, and an
 * empty one has no link yet.
 */
export function qrCodeWords(t: Translator['t'], value: string) {
  return {
    label: t(QR_CODE.label, { value }),
    errorTitle: t(QR_CODE.unavailable),
    errorMessage: value === '' ? t(QR_CODE.noLink) : t(QR_CODE.tooLong),
  };
}
