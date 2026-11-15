import { get } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { describe, expect, it } from 'vitest';
import { trustProxyHops } from '../../src/common/trusted-proxy';

/** What the app reads as a caller's address, asked by a caller who says it is `forwardedFor`. */
async function addressSeen(hops: number, forwardedFor: string): Promise<string> {
  const app = express();
  trustProxyHops(app, hops);
  app.get('/ip', (req, res) => {
    res.json({ ip: req.ip });
  });
  const server = app.listen(0);
  await new Promise<void>((done) => server.once('listening', () => done()));
  try {
    const { port } = server.address() as AddressInfo;
    const body = await new Promise<string>((done, fail) => {
      const asked = get(
        { host: '127.0.0.1', port, path: '/ip', headers: { 'x-forwarded-for': forwardedFor } },
        (answer) => {
          let read = '';
          answer.on('data', (chunk) => {
            read += String(chunk);
          });
          answer.on('end', () => done(read));
        },
      );
      asked.on('error', fail);
    });
    return (JSON.parse(body) as { ip: string }).ip;
  } finally {
    await new Promise((done) => server.close(done));
  }
}

/**
 * The public ceiling counts each customer by `req.ip` (`F5-78`): behind one proxy that is the
 * client the proxy forwarded, and with none trusted a forged header from a direct caller is ignored.
 */
describe('the address a request is counted under', () => {
  it.each([
    [0, '203.0.113.7', /127\.0\.0\.1$/],
    [1, '203.0.113.7', /^203\.0\.113\.7$/],
    // Two hops trusted, one forwarded: the client is the first address the proxies saw.
    [2, '198.51.100.4, 203.0.113.7', /^198\.51\.100\.4$/],
  ])('with %i trusted hops and %s forwarded', async (hops, forwardedFor, seen) => {
    expect(await addressSeen(hops, forwardedFor)).toMatch(seen);
  });
});
