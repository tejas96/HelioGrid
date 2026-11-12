'use client';

/**
 * A page the product does not draw — a stored file, the gateway's, a map — in a new tab with no
 * handle back to this one. A tab opened after an answer (a file's signed link) may be refused by
 * the browser's popup blocker — Safari refuses one opened after an `await` — so `window.open` then
 * gives nothing, and the page opens in this tab instead: the act is never silently lost.
 */
export function openExternal(url: string): void {
  const opened = window.open(url, '_blank');
  if (opened === null) window.location.assign(url);
  else opened.opener = null;
}

/** The maps a browser opens, asked for a place by its words. */
export function openDirections(place: string): void {
  openExternal(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`);
}
