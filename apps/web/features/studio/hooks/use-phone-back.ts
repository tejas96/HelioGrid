'use client';
import { useEffect, useRef } from 'react';
import { backFromPhone, inPhoneWebView } from '../../../lib/web-view-host';

/**
 * Inside the phone app's web view, the system back comes to this page (a platform adapter): it runs
 * `onBack`, which closes the top thing open before it leaves. Outside the phone it does nothing.
 */
export function usePhoneBack(onBack: () => void): void {
  const latest = useRef(onBack);
  latest.current = onBack;
  useEffect(() => {
    if (!inPhoneWebView()) return;
    return backFromPhone(() => latest.current());
  }, []);
}
