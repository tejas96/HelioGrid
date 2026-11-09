import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/**
 * Android's system Back closes the top layer first (`CLAUDE.md` §10): while `open`, Back calls
 * `close` and goes no further. Without it, Back under an open menu or bubble leaves the screen, or
 * the app, with the layer still drawn.
 */
export function useCloseOnBack(open: boolean, close: () => void): void {
  const latestClose = useRef(close);
  latestClose.current = close;
  useEffect(() => {
    if (!open) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      latestClose.current();
      return true;
    });
    return () => back.remove();
  }, [open]);
}
