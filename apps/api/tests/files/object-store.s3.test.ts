import { createServer, type Server, type Socket } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  S3ObjectStore,
  type S3StoreSettings,
} from '../../src/modules/file/internal/object-store.s3';

/**
 * The S3 adapter's links, read offline — signing is local arithmetic — and its outage bound
 * against a listener that accepts and never answers (`T-FPLAT-035` C6, C8, C13). The round trip
 * against a real store is the QA plan's.
 */
/** A timeout short enough to wait out, and how far past it the call may still end. */
const SHORT_TIMEOUT_MS = 300;
const TIMEOUT_SLACK = 10;
const CHECKSUM = 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=';

const settingsFor = (endpoint: string, requestMs = 5_000): S3StoreSettings => ({
  provider: 'local',
  endpoint,
  region: 'us-east-1',
  bucket: 'heliogrid-files-local',
  accessKeyId: 'heliogrid',
  secretAccessKey: 'heliogrid-local-secret',
  forcePathStyle: true,
  timeouts: { connectMs: requestMs, requestMs },
  maxAttempts: 1,
});

describe('S3ObjectStore links', () => {
  const store = new S3ObjectStore(settingsFor('http://127.0.0.1:9000'));

  it('the upload link signs length and checksum as headers, never as query', async () => {
    const signed = await store.signUpload({
      key: 'tenant/file',
      byteSize: 200,
      checksumSha256: CHECKSUM,
      expiresInSeconds: 900,
    });
    const url = new URL(signed.url);
    const signedHeaders = url.searchParams.get('X-Amz-SignedHeaders')?.split(';') ?? [];
    expect(signedHeaders).toEqual(
      expect.arrayContaining(['content-length', 'x-amz-checksum-sha256']),
    );
    expect(url.searchParams.has('x-amz-checksum-sha256')).toBe(false);
    expect(url.searchParams.get('X-Amz-Expires')).toBe('900');
    expect(url.pathname).toBe('/heliogrid-files-local/tenant/file');
    expect(signed.headers['x-amz-checksum-sha256']).toBe(CHECKSUM);
  });

  it('a download link forces the stored type as an attachment', async () => {
    const url = new URL(
      await store.signDownload({
        key: 'tenant/file',
        contentType: 'image/png',
        expiresInSeconds: 300,
      }),
    );
    expect(url.searchParams.get('response-content-type')).toBe('image/png');
    expect(url.searchParams.get('response-content-disposition')).toBe('attachment');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
  });
});

describe('S3ObjectStore outage', () => {
  let silent: Server;
  const sockets: Socket[] = [];
  let endpoint: string;

  beforeAll(async () => {
    // Accepts every connection and never writes a byte; each socket is dropped at teardown.
    silent = createServer((socket) => sockets.push(socket));
    await new Promise<void>((resolve) => silent.listen(0, '127.0.0.1', resolve));
    const address = silent.address();
    if (address === null || typeof address === 'string') throw new Error('no port');
    endpoint = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => silent.close(() => resolve()));
  });

  it('a store that never answers fails within the timeout', async () => {
    const store = new S3ObjectStore(settingsFor(endpoint, SHORT_TIMEOUT_MS));
    const started = Date.now();
    await expect(store.head('tenant/file')).rejects.toThrow();
    expect(Date.now() - started).toBeLessThan(SHORT_TIMEOUT_MS * TIMEOUT_SLACK);
  });
});
