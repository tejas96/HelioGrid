import { createHash } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { PRINT_READY_ATTRIBUTE, PRINT_REFUSED_ATTRIBUTE } from '@heliogrid/contracts/workflows';
import { describe, expect, it } from 'vitest';
import { createDocumentRenderActivities } from '../../src/modules/documents/documents.activities';

/** `F3-15`: a Hindi document is printed in a Devanagari face, never as empty boxes. */
const HINDI_PAGE = `<!doctype html><html lang="hi"><head><meta charset="utf-8">
<style>body { font-family: 'Noto Sans', 'Noto Sans Devanagari', sans-serif; }</style></head>
<body><h1>कर इनवॉइस</h1><p>क्षेत्र · श्री · द्वितीय</p></body></html>`;

/** A cold Chromium takes seconds to start; a render past this is stuck. */
const RENDER_TIMEOUT_MS = 60_000;

const PDF = 'application/pdf';
const OK = 200;
const FORBIDDEN = 403;
const NOT_FOUND = 404;

const pdfText = (base64: string) => Buffer.from(base64, 'base64').toString('latin1');

describe('the document renderer', () => {
  it(
    'Hindi HTML renders to a PDF that embeds a Devanagari face',
    async () => {
      const { renderPdf } = createDocumentRenderActivities();
      const { pdfBase64 } = await renderPdf({ html: HINDI_PAGE });
      const pdf = pdfText(pdfBase64);
      expect(pdf.startsWith('%PDF-')).toBe(true);
      expect(pdf).toMatch(/\/FontName\s*\/[A-Z]{6}\+[A-Za-z-]*Devanagari/);
    },
    RENDER_TIMEOUT_MS,
  );

  it(
    'loads nothing from the network: a page asking for a remote image still prints',
    async () => {
      const { renderPdf } = createDocumentRenderActivities();
      const { pdfBase64 } = await renderPdf({
        html: '<!doctype html><html><body><img src="https://example.com/a.png"><p>Invoice</p></body></html>',
      });
      expect(pdfText(pdfBase64).startsWith('%PDF-')).toBe(true);
    },
    RENDER_TIMEOUT_MS,
  );

  it(
    'a print page loads from its own origin alone, prints once ready, and its bytes go to the store, not the payload',
    async () => {
      const elsewhere = await listening(() => '');
      const store = await listening(() => '');
      const product = await listening((path) =>
        path === '/fact'
          ? 'Proposal for Anil'
          : `<!doctype html><html><body><img src="${elsewhere.origin}/pixel.png"><p id="fact"></p>
<script>fetch('/fact').then((answer) => answer.text()).then((fact) => {
  document.getElementById('fact').textContent = fact;
  document.documentElement.setAttribute('${PRINT_READY_ATTRIBUTE}', '');
});</script></body></html>`,
      );
      try {
        const { renderPagePdf } = createDocumentRenderActivities();
        const printed = await renderPagePdf({
          url: `${product.origin}/print`,
          origins: [product.origin],
          put: { url: `${store.origin}/bucket/key?signed=1`, headers: { 'content-type': PDF } },
        });
        expect(product.asked).toEqual(['/print', '/fact']);
        expect(elsewhere.asked).toEqual([]);
        // The browser never reached the store; Node PUT the bytes there once, as signed.
        expect(store.asked).toEqual(['/bucket/key?signed=1']);
        const [put] = store.received;
        if (put === undefined) throw new Error('nothing was PUT to the store');
        expect(put.method).toBe('PUT');
        expect(put.contentType).toBe(PDF);
        expect(pdfText(put.body.toString('base64')).startsWith('%PDF-')).toBe(true);
        // Only small facts ride back through Temporal.
        expect(printed).toEqual({
          byteSize: put.body.length,
          checksumSha256: createHash('sha256').update(put.body).digest('base64'),
        });
      } finally {
        await Promise.all([product.close(), elsewhere.close(), store.close()]);
      }
    },
    RENDER_TIMEOUT_MS,
  );

  it(
    'a store that refuses the bytes fails the render, so Temporal tries it again',
    async () => {
      const store = await listening(() => '', FORBIDDEN);
      const product = await listening(
        () => `<!doctype html><html ${PRINT_READY_ATTRIBUTE}><body><p>Proposal</p></body></html>`,
      );
      try {
        const { renderPagePdf } = createDocumentRenderActivities();
        await expect(
          renderPagePdf({
            url: `${product.origin}/print`,
            origins: [product.origin],
            put: { url: `${store.origin}/bucket/key`, headers: { 'content-type': PDF } },
          }),
        ).rejects.toThrow(/403/);
      } finally {
        await Promise.all([product.close(), store.close()]);
      }
    },
    RENDER_TIMEOUT_MS,
  );
});

/** Far inside the renderer's own 45-second wait: a refused page must not be waited out. */
const FAILS_AT_ONCE_MS = 10_000;

describe('a print page that cannot print fails the render at once (F5-39)', () => {
  it.each([
    [
      'a page that marks its read refused',
      () => `<!doctype html><html><body><script>
document.documentElement.setAttribute('${PRINT_REFUSED_ATTRIBUTE}', '');</script></body></html>`,
      OK,
    ],
    ['a page that answers an error', () => '<!doctype html><html><body></body></html>', NOT_FOUND],
  ])(
    '%s',
    async (_, bodyOf, status) => {
      const store = await listening(() => '');
      const product = await listening(bodyOf, status);
      try {
        const { renderPagePdf } = createDocumentRenderActivities();
        const began = Date.now();
        await expect(
          renderPagePdf({
            url: `${product.origin}/print`,
            origins: [product.origin],
            put: { url: `${store.origin}/bucket/key`, headers: { 'content-type': PDF } },
          }),
        ).rejects.toThrow(/print page/);
        expect(Date.now() - began).toBeLessThan(FAILS_AT_ONCE_MS);
        // Nothing was kept: no bytes reached the store.
        expect(store.asked).toEqual([]);
      } finally {
        await Promise.all([product.close(), store.close()]);
      }
    },
    RENDER_TIMEOUT_MS,
  );
});

/**
 * The page address carries the print grant and the store address its signature; each opens a
 * proposal or the bucket alone, and a failed render's error is what Temporal logs and keeps.
 */
describe('a render that fails names no credential', () => {
  const GRANT = 'the-print-grant-in-this-test';
  const SIGNATURE = 'the-store-signature-in-this-test';

  it.each([
    ['the print page cannot be reached', 'page'],
    ['the store cannot be reached', 'store'],
  ] as const)(
    '%s',
    async (_, unreachable) => {
      const closed = await listening(() => '');
      await closed.close();
      const product = await listening(
        () => `<!doctype html><html ${PRINT_READY_ATTRIBUTE}><body><p>Proposal</p></body></html>`,
      );
      try {
        const pageOrigin = unreachable === 'page' ? closed.origin : product.origin;
        const storeOrigin = unreachable === 'store' ? closed.origin : product.origin;
        const { renderPagePdf } = createDocumentRenderActivities();
        const failed: unknown = await renderPagePdf({
          url: `${pageOrigin}/print/proposal/v1?grant=${GRANT}`,
          origins: [pageOrigin],
          put: {
            url: `${storeOrigin}/bucket/key?X-Amz-Signature=${SIGNATURE}`,
            headers: { 'content-type': PDF },
          },
        }).then(
          () => null,
          (error: unknown) => error,
        );
        expect(failed).toBeInstanceOf(Error);
        const written = `${String(failed)} ${(failed as Error).stack} ${JSON.stringify(failed)}`;
        expect(written).not.toContain(GRANT);
        expect(written).not.toContain(SIGNATURE);
        expect((failed as Error).cause).toBeUndefined();
      } finally {
        await product.close();
      }
    },
    RENDER_TIMEOUT_MS,
  );
});

interface Received {
  readonly method: string;
  readonly contentType: string | undefined;
  readonly body: Buffer;
}

interface LocalOrigin {
  readonly origin: string;
  readonly asked: string[];
  readonly received: Received[];
  close(): Promise<void>;
}

/** An origin on this machine, recording every path it was asked for and every body sent to it. */
async function listening(bodyOf: (path: string) => string, status = OK): Promise<LocalOrigin> {
  const asked: string[] = [];
  const received: Received[] = [];
  const server: Server = createServer((request, response) => {
    const path = request.url ?? '/';
    asked.push(path);
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      if (request.method !== 'GET') {
        received.push({
          method: request.method ?? '',
          contentType: request.headers['content-type'],
          body: Buffer.concat(chunks),
        });
      }
      response.statusCode = status;
      response.setHeader('content-type', path === '/fact' ? 'text/plain' : 'text/html');
      response.end(bodyOf(path));
    });
  });
  await new Promise<void>((ready) => server.listen(0, '127.0.0.1', ready));
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${port}`,
    asked,
    received,
    close: () => new Promise<void>((closed) => server.close(() => closed())),
  };
}
