/**
 * Container-level deep linking.
 *
 * PATHS THEMSELVES LIVE ON EACH ROUTE (`linking: 'leads/:leadId'` on the route), so a route
 * and its URL are one edit and cannot drift apart. Only the prefixes are global, and they
 * belong here rather than in `App.tsx` — the entry file composes providers and knows nothing
 * about routes.
 *
 * `enabled: 'auto'` is deliberately NOT used. It would auto-generate a kebab-case path for
 * every leaf screen, which means renaming a route silently changes a public URL. Deep-link
 * paths are a contract with whatever sent the link; each one is declared on purpose.
 *
 * NOTE for the Track C notifications slice: a Notifee/FCM notification tap does NOT arrive as
 * a URL — it hands back a data payload. A `linking:` entry alone will not route it. The seam
 * is here: `getInitialURL` and `subscribe` are accepted alongside `prefixes`, so the payload
 * can be translated into a URL and reuse this same route table. Small, but not free.
 */
export const linkingOptions = {
  prefixes: ['heliogrid://'],
};
