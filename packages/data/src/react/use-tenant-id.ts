'use client';
import { useSession } from './use-session';

/** The signed-in person's company id, `''` before the session holds one. */
export function useTenantId(): string {
  return useSession().user?.tenant?.id ?? '';
}
