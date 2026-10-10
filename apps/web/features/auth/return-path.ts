/** Where this tab holds the address a signed-out visitor opened, across the sign-in and Google's page. */
const KEPT_KEY = 'hg.return-to';

/**
 * Whether this page load has let a person inside. From then on it keeps no address: one who signs
 * out is leaving, and whoever signs in next in this tab starts at their own home — also when Back
 * brings the tab to a page the first person had open.
 */
let someoneWasInside = false;

/**
 * Keeps the address this tab is on for the sign-in that follows (`M01-61`). A browser that refuses
 * storage keeps nothing, and sign-in opens the home.
 */
export function keepReturnPath(): void {
  if (someoneWasInside) return;
  try {
    sessionStorage.setItem(KEPT_KEY, `${window.location.pathname}${window.location.search}`);
  } catch {
    // Storage is refused: nothing is kept.
  }
}

/**
 * The address a visitor was turned away from, or `null`. Only a path on this site is handed back:
 * the value is resolved as the router resolves it, and one that names another site — `//host`, or
 * the same behind a tab the browser strips or a backslash it reads as a slash — is dropped, so a
 * person who has just signed in is never sent there.
 */
export function keptReturnPath(): string | null {
  try {
    const kept = sessionStorage.getItem(KEPT_KEY);
    return kept !== null && isPathOnThisSite(kept) ? kept : null;
  } catch {
    return null;
  }
}

/** A person is inside: the kept address is spent, and this page load keeps no other. */
export function forgetReturnPath(): void {
  someoneWasInside = true;
  try {
    sessionStorage.removeItem(KEPT_KEY);
  } catch {
    // Storage is refused: nothing was kept.
  }
}

function isPathOnThisSite(address: string): boolean {
  const here = window.location.origin;
  return address.startsWith('/') && new URL(address, here).origin === here;
}
