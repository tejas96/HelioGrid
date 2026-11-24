'use client';
import { useEffect } from 'react';
import { inPhoneWebView, insetsFromPhone } from '../../../lib/web-view-host';

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

/**
 * Inside the phone app's web view the studio runs under the phone's own bars (a platform adapter):
 * their reach lands as `--hg-phone-inset-<side>` (and `data-phone-insets`) on the page, which the studio's frame keeps its
 * controls clear of, beside the browser's own safe areas. Outside the phone it does nothing.
 */
export function usePhoneInsets(): void {
  useEffect(() => {
    if (!inPhoneWebView()) return;
    const root = document.documentElement;
    const stop = insetsFromPhone((insets) => {
      for (const side of SIDES) {
        root.style.setProperty(`--hg-phone-inset-${side}`, `${insets[side]}px`);
      }
      root.dataset.phoneInsets = '';
    });
    return () => {
      stop();
      for (const side of SIDES) root.style.removeProperty(`--hg-phone-inset-${side}`);
      delete root.dataset.phoneInsets;
    };
  }, []);
}
