import { useEffect, useRef } from 'react';
import type { ToastItem, ToastQueue } from './ToastHost.types';

/**
 * A moment for something that landed elsewhere on the page: when a count the page reads rises — an
 * invite now on the team, a release now out — one toast plays. The first reading only sets where
 * the count stands, and a count that falls or stays raises nothing.
 */
export function useRiseMoment(
  push: ToastQueue['push'],
  count: number | null,
  toast: Omit<ToastItem, 'id'>,
): void {
  const last = useRef(count);
  useEffect(() => {
    if (count !== null && last.current !== null && count > last.current) push(toast);
    if (count !== null) last.current = count;
  }, [count, push, toast]);
}
