'use client';
import {
  readSiteMapMessage,
  WEB_VIEW_BRIDGE_VERSION,
  type WebViewAsk,
  webViewBackSchema,
  webViewLendSchema,
} from '@heliogrid/contracts';
import type { BorrowedToken } from '@heliogrid/data';

/** How long the page waits for the phone to lend a token before it reads as signed out. */
const LEND_WAIT_MS = 10_000;

interface PhoneHost {
  postMessage(message: string): void;
}

/** The phone app around this page, when the page is shown in its web view. */
function phoneHost(): PhoneHost | null {
  if (typeof window === 'undefined') return null;
  return (window as { ReactNativeWebView?: PhoneHost }).ReactNativeWebView ?? null;
}

/** Whether this page is shown inside the phone app's web view (`T-M05-002a`). */
export function inPhoneWebView(): boolean {
  return phoneHost() !== null;
}

function ask(message: WebViewAsk): void {
  phoneHost()?.postMessage(JSON.stringify(message));
}

/** The person pressed the way back: the phone goes back a screen. */
export function leaveToPhone(): void {
  ask({ v: WEB_VIEW_BRIDGE_VERSION, kind: 'leave' });
}

/** A moment the phone marks with a tap: a snap, a close, the slider's tick, or a refusal. */
export function hapticToPhone(strength: 'selection' | 'impact'): void {
  ask({ v: WEB_VIEW_BRIDGE_VERSION, kind: 'haptic', strength });
}

/** The person asked to change the site details: the phone opens its own Site details. */
export function siteToPhone(): void {
  ask({ v: WEB_VIEW_BRIDGE_VERSION, kind: 'site' });
}

/**
 * The phone's system back, taken by this page: the phone is told the page takes it, and each back
 * runs `onBack`. Returns the way to stop listening.
 */
export function backFromPhone(onBack: () => void): () => void {
  const heard = (event: Event) => {
    if (readSiteMapMessage(webViewBackSchema, (event as MessageEvent).data) !== null) onBack();
  };
  // iOS hands a message to the window, Android to the document.
  window.addEventListener('message', heard);
  document.addEventListener('message', heard);
  ask({ v: WEB_VIEW_BRIDGE_VERSION, kind: 'back-here' });
  return () => {
    window.removeEventListener('message', heard);
    document.removeEventListener('message', heard);
    ask({ v: WEB_VIEW_BRIDGE_VERSION, kind: 'back-gone' });
  };
}

/**
 * The sign-in the phone lends this page: its short-lived API token, asked for when the page
 * starts and again when it lapses, kept in memory alone — never stored and never in the address.
 * A phone that does not answer leaves the page signed out.
 */
export function tokenFromPhone(): BorrowedToken {
  let token: string | null | undefined;
  let pending: Promise<string | null> | null = null;
  let settle: ((lent: string | null) => void) | null = null;
  const heard = (event: Event) => {
    const lent = readSiteMapMessage(webViewLendSchema, (event as MessageEvent).data);
    if (lent === null) return;
    token = lent.token;
    settle?.(token);
  };
  // iOS hands a message to the window, Android to the document.
  window.addEventListener('message', heard);
  document.addEventListener('message', heard);
  const asked = (): Promise<string | null> => {
    pending ??= new Promise<string | null>((resolve) => {
      const wait = setTimeout(() => settle?.(null), LEND_WAIT_MS);
      settle = (lent) => {
        clearTimeout(wait);
        pending = null;
        settle = null;
        resolve(lent);
      };
      ask({ v: WEB_VIEW_BRIDGE_VERSION, kind: 'token-needed' });
    });
    return pending;
  };
  return {
    current: () => (token === undefined ? asked() : Promise.resolve(token)),
    renew: () => {
      token = undefined;
      return asked();
    },
  };
}
