'use client';
import { PRINT_READY_ATTRIBUTE, PRINT_REFUSED_ATTRIBUTE } from '@heliogrid/contracts/workflows';
import { useEffect } from 'react';

/**
 * The print page tells the renderer when to print (`T-M06-017`): the document is light whatever the
 * machine prefers, and the root element carries `PRINT_READY_ATTRIBUTE` only once every sheet is
 * drawn, its faces are loaded and its pictures decoded — never before, and never for a page that
 * drew nothing.
 */
export function usePrintReady(drawn: boolean): void {
  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
  }, []);

  useEffect(() => {
    if (!drawn) return;
    let left = false;
    const pictures = [...document.images].map((picture) =>
      picture.complete ? Promise.resolve() : picture.decode().catch(() => undefined),
    );
    void Promise.all([document.fonts.ready, ...pictures]).then(() => {
      if (!left) document.documentElement.setAttribute(PRINT_READY_ATTRIBUTE, '');
    });
    return () => {
      left = true;
      document.documentElement.removeAttribute(PRINT_READY_ATTRIBUTE);
    };
  }, [drawn]);
}

/**
 * A print page whose read was refused — a grant expired or not its own — says so on its root
 * element at once (`PRINT_REFUSED_ATTRIBUTE`), so the renderer fails the print now rather than
 * waiting out its timeout, and no empty page is ever kept as the PDF (`F5-39`).
 */
export function usePrintRefused(refused: boolean): void {
  useEffect(() => {
    if (!refused) return;
    document.documentElement.setAttribute(PRINT_REFUSED_ATTRIBUTE, '');
    return () => document.documentElement.removeAttribute(PRINT_REFUSED_ATTRIBUTE);
  }, [refused]);
}

/** The page's title is the document's own name, which the PDF carries as its title. */
export function usePrintTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
