import { describe, expect, it } from 'vitest';
import { createDocumentRenderActivities } from '../../src/modules/documents/documents.activities';

/** `F3-15`: a Hindi document is printed in a Devanagari face, never as empty boxes. */
const HINDI_PAGE = `<!doctype html><html lang="hi"><head><meta charset="utf-8">
<style>body { font-family: 'Noto Sans', 'Noto Sans Devanagari', sans-serif; }</style></head>
<body><h1>कर इनवॉइस</h1><p>क्षेत्र · श्री · द्वितीय</p></body></html>`;

/** A cold Chromium takes seconds to start; a render past this is stuck. */
const RENDER_TIMEOUT_MS = 60_000;

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
});
