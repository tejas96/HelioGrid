'use client';
import { useDataLayer } from './context';

/**
 * The phone's API token, fresh, for a page it shows in a web view (`T-M05-002a`): the page asks,
 * the phone answers through the web view's messages. Never the session, which stays in the jar;
 * `null` on the web and with no one signed in.
 */
export function useLendToken(): () => Promise<string | null> {
  return useDataLayer().lendToken;
}
