import type { ReactNode } from 'react';

/**
 * The resolved custom properties a tenant colour is allowed to reach. Keys are the CSS custom
 * property names the web scope writes; the native scope carries the same map through context.
 */
export type TenantTokens = Record<string, string>;

export interface CustomerSurfaceProps {
  /** The tenant's primary brand colour, "#RRGGBB". Without a valid one, nothing is re-tinted. */
  brandColor?: string;
  /**
   * Recorded as `data-tenant` — useful in review and in QA, **never rendered**. The visible
   * identity is `TenantHeader` (or `TenantMark`), mounted inside this scope: this component is
   * the colour's boundary, not the lockup.
   */
  tenantName?: string;
  fullHeight?: boolean;
  children?: ReactNode;
}
