'use client';
import type { OpenGoogle } from '@heliogrid/data/react';
import type { GoogleSheetResult } from '@heliogrid/domain';
import { useEffect, useRef } from 'react';
import { GOOGLE_WEB_CLIENT_ID } from '../../../lib/env';
import { GOOGLE_RETURN_ROUTE } from '../constants';

/** Google's own sign-in page; the web cannot draw Google's button, so it goes there instead. */
const GOOGLE_SIGN_IN_PAGE = 'https://accounts.google.com/o/oauth2/v2/auth';
/** Where the value sent to Google waits while the tab is on Google's page. */
const PENDING_KEY = 'hg.google.pending';
/** Google's answer when the person backs out of its page; a cancel is silent (`SCR-M01-01` decision 11). */
const CANCELLED = 'access_denied';

/**
 * The web's Google sheet (`M01-02`): a press leaves the tab for Google's sign-in page, which comes
 * back to `GOOGLE_RETURN_ROUTE` with an ID token in the fragment. One random value is sent as both
 * the nonce, which the server matches inside the token, and the state, which this tab matches on
 * the way back — so a token planted from another site never signs anyone in here. Absent a
 * client id, the door has no sheet and draws no Google control.
 */
export function useGoogleSheet(): OpenGoogle | undefined {
  if (GOOGLE_WEB_CLIENT_ID === undefined) return undefined;
  const clientId = GOOGLE_WEB_CLIENT_ID;
  return () => {
    const pending = crypto.randomUUID();
    sessionStorage.setItem(PENDING_KEY, pending);
    const query = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}${GOOGLE_RETURN_ROUTE}`,
      response_type: 'id_token',
      scope: 'openid email',
      nonce: pending,
      state: pending,
      prompt: 'select_account',
    });
    window.location.assign(`${GOOGLE_SIGN_IN_PAGE}?${query}`);
    // The tab is leaving, and the flow resumes on the return route. A browser that restores this
    // page from its back cache restores the pending press too: that is the person backing out.
    return new Promise<GoogleSheetResult>((settle) => {
      window.addEventListener(
        'pageshow',
        (event) => {
          if (event.persisted) settle({ kind: 'cancelled' });
        },
        { once: true },
      );
    });
  };
}

/**
 * Reads Google's answer off the return route's fragment ONCE, clears it from the address bar so a
 * reload cannot replay it, and hands it to the door. A route with no answer hands nothing.
 */
export function useGoogleReturn(hand: (result: GoogleSheetResult) => void): void {
  const handOver = useRef(hand);
  handOver.current = hand;
  useEffect(() => {
    // Only the return route reads an answer: a fragment pasted onto /login is no answer of Google's.
    if (window.location.pathname !== GOOGLE_RETURN_ROUTE) return;
    const answer = new URLSearchParams(window.location.hash.slice(1));
    if (!answer.has('id_token') && !answer.has('error')) return;
    const pending = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    window.history.replaceState(null, '', window.location.pathname);
    handOver.current(resultOf(answer, pending));
  }, []);
}

function resultOf(answer: URLSearchParams, pending: string | null): GoogleSheetResult {
  if (answer.get('error') === CANCELLED) return { kind: 'cancelled' };
  const idToken = answer.get('id_token');
  if (idToken === null || pending === null || answer.get('state') !== pending) {
    return { kind: 'failed' };
  }
  return { kind: 'token', token: { idToken, nonce: pending, email: emailIn(idToken) } };
}

/** The email in the token's claims, for the link step's tile only — the server trusts nothing here. */
function emailIn(idToken: string): string {
  try {
    const payload = idToken.split('.')[1] ?? '';
    const claims: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const email = (claims as { email?: unknown }).email;
    return typeof email === 'string' ? email : '';
  } catch {
    return '';
  }
}
