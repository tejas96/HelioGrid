import { useCallback, useRef, useState } from 'react';
import type { ToastItem, ToastQueue } from './ToastHost.types';

/**
 * Queue helper: `const { toasts, push, dismiss } = useToasts()`.
 *
 * Platform-neutral — React state and nothing else — so both halves of ToastHost share it.
 */
export function useToasts(): ToastQueue {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((toast: Omit<ToastItem, 'id'>): number => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((list) => [...list, { id, ...toast }]);
    return id;
  }, []);

  const dismiss = useCallback((id: number | string) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, push, dismiss };
}
