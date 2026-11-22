import { z } from 'zod';

/**
 * What a phone and a web page it shows in its web view say to each other, so the page is signed in
 * as the phone's person (`T-M05-002a`): the studio is one web page, and iOS and Android show it in
 * their app. The phone lends the page its short-lived API token, never its session; the token
 * travels in a message, never in the page's address, and the page keeps it in memory alone.
 *
 * An installed phone app outlives a release of the page, and the page outlives the app: each side
 * reads a message with `readSiteMapMessage`, which answers `null` for a version or a kind it does
 * not know. A change no old reader can drop is a new version beside this one.
 */
export const WEB_VIEW_BRIDGE_VERSION = 1 as const;

const version = z.literal(WEB_VIEW_BRIDGE_VERSION);

/** Phone → page: the token to sign in with, or `null` when the phone's person is signed out. */
export const webViewLendSchema = z.object({
  v: version,
  kind: z.literal('token'),
  token: z.string().min(1).nullable(),
});
export type WebViewLend = z.infer<typeof webViewLendSchema>;

/**
 * Phone → page: Android's system back, sent only to a page that said `back-here`. The page closes
 * the top thing open, or takes its own way back. A page older than this reads it as `null`.
 */
export const webViewBackSchema = z.object({ v: version, kind: z.literal('back') });
export type WebViewBack = z.infer<typeof webViewBackSchema>;

/**
 * Page → phone. `token-needed`: the page is ready, or its token lapsed — send one. `leave`: the
 * person pressed the way back; the phone goes back a screen. `site`: the person asked to change the
 * site details; the phone opens its own Site details in the studio's place. `haptic`: the phone taps
 * — a light `selection` on a snap, a close or the slider's tick, a short `impact` on a refusal
 * (`T-M05-002`, part b). `back-here`: the page takes the system back itself — the phone sends it
 * `back` and goes no further, until `back-gone` says the page stopped listening; a phone that never
 * hears it leaves the screen on back, as before. A
 * phone app older than a kind reads it as `null` and does nothing.
 */
export const webViewAskSchema = z.discriminatedUnion('kind', [
  z.object({ v: version, kind: z.literal('token-needed') }),
  z.object({ v: version, kind: z.literal('leave') }),
  z.object({ v: version, kind: z.literal('site') }),
  z.object({ v: version, kind: z.literal('back-here') }),
  z.object({ v: version, kind: z.literal('back-gone') }),
  z.object({ v: version, kind: z.literal('haptic'), strength: z.enum(['selection', 'impact']) }),
]);
export type WebViewAsk = z.infer<typeof webViewAskSchema>;
