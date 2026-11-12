'use client';
import { type PaymentsScreen, useShell } from '@heliogrid/data/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { openExternal } from '../../../lib/open-external';
import { pickReceiptPhoto } from '../../../lib/pick-file';
import { HOME_ROUTE } from '../../auth';
import { DOOR_PATH, projectPath } from '../../shell';
import { wayBackOf } from './use-project-moves';

/**
 * The payments page's web moves — the platform adapter: the router, the customer's chat opened in a
 * new tab, the clipboard the pay message and the receipt go to (the person sends them; after a
 * hand-off the page asks whether it went out, and records it only on their yes), the receipt PDF
 * opened in a tab, the browser's photo chooser, and the collect sheet a link opens on arrival.
 */
export function usePaymentMoves(projectId: string, screen: PaymentsScreen) {
  const router = useRouter();
  const wayBack = wayBackOf(useShell().doors);
  useCollectOnArrival(screen);
  useFreedPreview(screen.photo?.preview ?? null);
  const copy = (text: string, then: () => void) => {
    void navigator.clipboard.writeText(text).then(then, () => screen.say({ kind: 'notCopied' }));
  };
  return {
    wayBack,
    toWayBack: () => router.push(wayBack === 'home' ? HOME_ROUTE : DOOR_PATH[wayBack]),
    toProject: () => router.push(projectPath(projectId)),
    sheet: {
      openChat: (uri: string, partId: string) => {
        openExternal(uri);
        askOnReturn(() => screen.handedOff(partId));
      },
      sendMessage: (text: string, partId: string) => copy(text, () => screen.handedOff(partId)),
      fullScreen: (partId: string) => screen.showQr(partId),
      pickPhoto: () => pickReceiptPhoto(screen.pickPhoto),
    },
    shareReceipt: (entryId: string) => {
      void screen.receipt(entryId).then(
        (receipt) => copy(receipt.text, () => screen.say({ kind: 'copied' })),
        () => screen.say({ kind: 'receiptFailed' }),
      );
    },
    receiptPdf: (entryId: string) => {
      void screen.receiptPdf(entryId).then(
        (url) => (url === null ? screen.say({ kind: 'receiptPreparing' }) : openExternal(url)),
        () => screen.say({ kind: 'receiptFailed' }),
      );
    },
    addPhoto: (entryId: string) =>
      pickReceiptPhoto((photo) => {
        // Stored from its bytes: the local address a preview needs is let go at once.
        URL.revokeObjectURL(photo.preview);
        screen.addPhoto(entryId, photo);
      }),
    openPhoto: (fileId: string) => {
      void screen.fileLink(fileId).then(
        (url) => openExternal(url),
        () => screen.say({ kind: 'photoFailed' }),
      );
    },
  };
}

/**
 * Asks whether the request went out once the person is back on this tab — asked while they were in
 * the chat's tab, the question would be gone before they could answer it.
 */
function askOnReturn(ask: () => void): void {
  window.addEventListener('focus', ask, { once: true });
}

/** A picked photo's local address holds its bytes until it is let go: once replaced or gone. */
function useFreedPreview(preview: string | null) {
  useEffect(() => {
    if (preview === null) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);
}

/** `?collect=<part>` opens that part's collect sheet once the payments are read, and only once. */
function useCollectOnArrival(screen: PaymentsScreen) {
  const router = useRouter();
  const pathname = usePathname();
  const partId = useSearchParams().get('collect');
  const opened = useRef(false);
  // Only a reader who may share the request has its sheet opened for them (`M11-53`).
  const ready = screen.read.kind === 'ready' && screen.read.value.acts.share;
  useEffect(() => {
    if (partId === null || !ready || opened.current) return;
    opened.current = true;
    screen.open({ kind: 'collect', partId });
    // The link has done its job: a reload shows the page, not the sheet again.
    router.replace(pathname, { scroll: false });
  }, [partId, ready, screen, router, pathname]);
}
