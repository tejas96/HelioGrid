import type { TranslatedText } from '@heliogrid/contracts';

/**
 * Every word is the caller's (`@heliogrid/i18n`'s `qrCodeWords`): the code's accessible name names
 * the destination, and a code that cannot be drawn says why in the reader's language.
 */
export interface QRCodeProps {
  /**
   * The URL to encode. Up to 213 bytes / ASCII characters (QR version 10, EC level M).
   * Beyond that the component fails visibly rather than drawing an unscannable square.
   */
  value: string;
  size?: number;
  /** Accessible name — "QR code for <value>", so a screen reader gets the destination. */
  label: TranslatedText;
  caption?: TranslatedText;
  /** Quiet-zone modules around the code. 4 is the spec minimum — don't go lower. */
  quietZone?: number;
  /** Show the link as text under the code. Keep it on: it is the fallback path. */
  showValue?: boolean;
  /** The failed code's title — "QR code unavailable". Any value can fail, so it is required. */
  errorTitle: TranslatedText;
  /** Why there is no code — the link is too long, or there is none yet (an empty `value`). */
  errorMessage: TranslatedText;
}
