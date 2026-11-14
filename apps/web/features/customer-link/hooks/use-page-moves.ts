'use client';
import { copyText } from '../../../lib/copy-text';
import { openExternal } from '../../../lib/open-external';

/**
 * What the customer's page hands to the browser: a file opened from its short-lived link, and a
 * number put on the clipboard. Each answers whether it happened, so the page says so where the
 * person acted.
 */
export function usePageMoves(fileLink: (fileId: string) => Promise<string | null>) {
  return {
    /** Opens a file the page lists; `false` where its link could not be read. */
    openFile: async (fileId: string): Promise<boolean> => {
      const url = await fileLink(fileId);
      if (url === null) return false;
      openExternal(url);
      return true;
    },
    openAddress: (url: string) => openExternal(url),
    copy: copyText,
  };
}
