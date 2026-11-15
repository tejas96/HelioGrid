/** A generated version as a screen reads where it stands: its number and when it was shared, if ever. */
export interface VersionShare {
  readonly version: number;
  readonly sharedAt: string | null;
}

/** What the customer's link serves and what waits behind it (`M06-45`). */
export interface VersionsOnLink {
  /** The version a screen shows as sent: the newest shared one, else the newest generated. */
  readonly shown: number | null;
  /** A newer version generated and not yet shared while an older one is on the link; `null` when none waits. */
  readonly awaitingShare: number | null;
}

/**
 * The customer's link serves the latest SHARED version (`M06-45`): a newer one only generated is
 * invisible to them, so a screen shows the shared one and offers the newer one to share.
 */
export function versionsOnLink(versions: readonly VersionShare[]): VersionsOnLink {
  const newestFirst = [...versions].sort((a, b) => b.version - a.version);
  const latest = newestFirst[0]?.version ?? null;
  const shared = newestFirst.find((one) => one.sharedAt !== null)?.version ?? null;
  if (shared === null || shared === latest) return { shown: latest, awaitingShare: null };
  return { shown: shared, awaitingShare: latest };
}

/** The standings whose link still takes a newer version: before Won, and not closed or replaced. */
const OPEN_ON_LINK: readonly string[] = ['shared', 'opened', 'negotiating', 'accepted', 'declined'];

/**
 * The newer version a screen offers to share, by where the proposal stands: none once the deal is
 * won (a version then waits to be put in force), withdrawn or replaced.
 */
export function versionAwaitingShare(
  standing: string,
  versions: readonly VersionShare[],
): number | null {
  return OPEN_ON_LINK.includes(standing) ? versionsOnLink(versions).awaitingShare : null;
}
