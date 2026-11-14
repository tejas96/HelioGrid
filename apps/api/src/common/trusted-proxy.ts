/** What `trustProxyHops` sets: an Express app, or the Nest app over one. */
interface HasSettings {
  set(setting: 'trust proxy', value: number): unknown;
}

/**
 * Reads a request's address through `hops` proxies in front of the api, and no more: with 0 the
 * address is the socket's and a forwarded header is ignored, so a caller cannot forge its way to a
 * fresh share of the public ceiling (`F5-78`); with the real count, each customer behind the
 * proxies is their own address rather than all sharing the proxy's.
 */
export function trustProxyHops(app: HasSettings, hops: number): void {
  app.set('trust proxy', hops);
}
