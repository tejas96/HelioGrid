import type { DocumentRenderActivities } from '@heliogrid/contracts/workflows';
import { type Browser, chromium } from 'playwright';

/**
 * The renderer (`03-tech-stack.md` §16, `F3-15`): Chromium prints the page as it is — its HarfBuzz
 * is what shapes Devanagari conjuncts correctly. One browser per process, started on the first
 * render and started again if it dies; each render gets a fresh context, so no page sees
 * another's state.
 *
 * Retried by Temporal, and safe to retry: it only reads its input and returns bytes.
 */
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
  };
}

export const documentRenderActivities: DocumentRenderActivities = createDocumentRenderActivities();
