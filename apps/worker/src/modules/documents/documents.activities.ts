import { createHash } from 'node:crypto';
import {
  type DocumentRenderActivities,
  type PageToPrint,
  PRINT_READY_ATTRIBUTE,
  PRINT_REFUSED_ATTRIBUTE,
  type PrintedDocument,
} from '@heliogrid/contracts/workflows';
import { type APIRequestContext, type Browser, type BrowserContext, chromium } from 'playwright';

/**
 * The renderer (`03-tech-stack.md` §16, `F3-15`): Chromium prints the page as it is — its HarfBuzz
 * is what shapes Devanagari conjuncts correctly. One browser per process, started on the first
 * render and started again if it dies; each render gets a fresh context, so no page sees
 * another's state.
 *
 * Retried by Temporal, and safe to retry: it reads its input and returns bytes, or PUTs them under
 * the one key its record has, where a second PUT replaces the first.
 */
/** A print page that has not drawn within this is stuck; Temporal retries the render. */
const PAGE_LOAD_TIMEOUT_MS = 45_000;

export function createDocumentRenderActivities(): DocumentRenderActivities {
  let browser: Promise<Browser> | null = null;

  const running = (): Promise<Browser> => {
    browser ??= chromium.launch().then(
      (started) => {
        started.on('disconnected', () => {
          browser = null;
        });
        return started;
      },
      (failed: unknown) => {
        // A launch that failed is not kept: the next render, or Temporal's retry, launches again.
        browser = null;
        throw failed;
      },
    );
    return browser;
  };

  return {
    async renderPdf({ html }) {
      const context = await (await running()).newContext();
      try {
        const page = await context.newPage();
        // The page carries everything it shows; nothing loads from the network.
        await page.route('**/*', (route) => route.abort());
        await page.setContent(html, { waitUntil: 'load' });
        const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
        return { pdfBase64: pdf.toString('base64') };
      } finally {
        await context.close();
      }
    },

    async renderPagePdf({ url, origins, put }) {
      const context = await (await running()).newContext();
      try {
        return await printedPage(context, url, origins, put);
      } catch (failed) {
        throw withoutQueries(failed);
      } finally {
        await context.close();
      }
    },
  };
}

/**
 * The page address carries the print grant and the store address its signature, and Playwright
 * names the address it failed on; Temporal logs a failed activity's error and keeps it in the
 * workflow's history. So the render fails with the message alone, every address cut at its query,
 * and with no cause or call log that would repeat it.
 */
function withoutQueries(failed: unknown): Error {
  const message = failed instanceof Error ? failed.message : String(failed);
  return new Error(message.replace(/(https?:\/\/[^\s"'?]*)\?[^\s"']*/g, '$1'));
}

async function printedPage(
  context: BrowserContext,
  url: string,
  origins: readonly string[],
  put: PageToPrint['put'],
): Promise<PrintedDocument> {
  const page = await context.newPage();
  // The page loads from the product's own web and api alone; anything else it asks for is refused.
  await page.route('**/*', (route) =>
    origins.includes(new URL(route.request().url()).origin) ? route.continue() : route.abort(),
  );
  const answer = await page.goto(url, { waitUntil: 'load', timeout: PAGE_LOAD_TIMEOUT_MS });
  if (answer !== null && !answer.ok()) {
    throw new Error(`the print page answered ${answer.status()}`);
  }
  // Its data arrives after load: it prints once the page says every sheet is drawn, and a
  // page whose read was refused says so at once, so it is never waited out or printed empty.
  const settled = await page.waitForSelector(
    `[${PRINT_READY_ATTRIBUTE}], [${PRINT_REFUSED_ATTRIBUTE}]`,
    { state: 'attached', timeout: PAGE_LOAD_TIMEOUT_MS },
  );
  if (
    await settled.evaluate((root, refused) => root.hasAttribute(refused), PRINT_REFUSED_ATTRIBUTE)
  ) {
    throw new Error('the print page refused its grant');
  }
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  return await stored(context.request, pdf, put);
}

/** A store that has not taken the bytes within this is stuck; Temporal retries the render. */
const STORE_PUT_TIMEOUT_MS = 30_000;

/**
 * The PDF PUT to the store by the context's own request client, which runs in this process and
 * outside the page's routes — so the store's host is never an origin the page may reach. No
 * redirect is followed: the bytes go to the signed address alone.
 */
async function stored(
  client: APIRequestContext,
  pdf: Buffer,
  put: PageToPrint['put'],
): Promise<PrintedDocument> {
  const answer = await client.put(put.url, {
    headers: { ...put.headers },
    data: pdf,
    maxRedirects: 0,
    timeout: STORE_PUT_TIMEOUT_MS,
  });
  if (!answer.ok()) throw new Error(`the store refused the PDF: ${answer.status()}`);
  return {
    byteSize: pdf.length,
    checksumSha256: createHash('sha256').update(pdf).digest('base64'),
  };
}

export const documentRenderActivities: DocumentRenderActivities = createDocumentRenderActivities();
