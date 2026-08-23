import { createContext, useContext } from 'react';
import type { TenantTokens } from './CustomerSurface.types';

/**
 * WEB → RN MAPPING. On the web the scope is enforced by CSS itself: the resolved tokens are
 * inline custom properties on `CustomerSurface`'s own node, so the subtree re-tints and nothing
 * outside it can, because a custom property set on an element cannot escape it.
 *
 * React Native has no custom properties and no cascade, so the equivalent scope is this context:
 * `CustomerSurface` provides the resolved map, and the components built to read a tenant token
 * (`TenantMark`'s monogram) read it from here with the same neutral fallback they get on the web
 * when the token is unset. The prohibition still holds by scope — an operator screen that never
 * mounts `CustomerSurface` has no provider, so every reader falls back to neutral — but it is
 * enforced by React rather than by CSS, and it only reaches components that opt in.
 */
export const TenantScopeContext = createContext<TenantTokens | null>(null);

/** The resolved tenant tokens for this subtree, or null outside a `CustomerSurface`. */
export function useTenantScope(): TenantTokens | null {
  return useContext(TenantScopeContext);
}
