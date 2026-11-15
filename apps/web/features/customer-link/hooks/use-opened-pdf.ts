'use client';
import type { CustomerPageScreen } from '@heliogrid/data/react';
import { openExternal } from '../../../lib/open-external';

/**
 * The PDF opens once it is made (`F5-39`): the customer asked for it with one tap, and a document
 * still being rendered then arrives without a second one. The address is read at the tap, and one
 * about to expire is asked for afresh (`MadeFileRead.get`), so a page left open never opens a dead
 * link.
 */
export function useOpenedPdf(pdf: CustomerPageScreen['pdf']): () => void {
  return () => pdf.get(openExternal);
}
