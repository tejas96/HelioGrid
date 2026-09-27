/**
 * The version a phone runs and the server-declared minimum it must meet (`F4-36`).
 *
 * The grammar is one to three dot-separated whole numbers — what the App Store's
 * `CFBundleShortVersionString` allows and what the Play build's `versionName` is written as. A
 * missing part is 0, so `1.0` is `1.0.0`. Each part is compared as a NUMBER: as text `1.10` sorts
 * below `1.9`, which would refuse a supported phone.
 */
export interface ClientVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

/**
 * The stores a phone is updated from. Its own vocabulary, not the push platforms': a push
 * transport can gain a platform — web push — that no store sells.
 */
export const STORE_PLATFORMS = ['ios', 'android'] as const;
export type StorePlatform = (typeof STORE_PLATFORMS)[number];

/* Nine digits a part keeps every value a safe integer, and bounds what a header can make us read. */
const VERSION_GRAMMAR = /^(\d{1,9})(?:\.(\d{1,9}))?(?:\.(\d{1,9}))?$/;

/** The version `text` names, or null when it is not one to three dotted whole numbers. */
export function parseClientVersion(text: string): ClientVersion | null {
  const parts = VERSION_GRAMMAR.exec(text);
  if (parts === null) return null;
  return {
    major: Number(parts[1]),
    minor: Number(parts[2] ?? 0),
    patch: Number(parts[3] ?? 0),
  };
}

/**
 * Whether a phone that sent `sent` must update. A version that cannot be read is below any
 * minimum: the phone is told to update rather than served on a guess about what it speaks.
 */
export function isBelowMinimum(sent: string, minimum: ClientVersion): boolean {
  const version = parseClientVersion(sent);
  if (version === null) return true;
  if (version.major !== minimum.major) return version.major < minimum.major;
  if (version.minor !== minimum.minor) return version.minor < minimum.minor;
  return version.patch < minimum.patch;
}
