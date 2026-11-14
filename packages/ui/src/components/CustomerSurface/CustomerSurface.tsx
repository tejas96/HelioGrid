import type { CSSProperties, JSX } from 'react';
import { createElement } from 'react';
import { classNames } from '../../primitives/class-names';
import type { CustomerSurfaceProps, TenantTokens } from './CustomerSurface.types';
import { tenantTokens } from './tenant-tokens';

/**
 * The resolved tokens are written as inline custom properties on this element. That is the
 * mechanism, not a styling shortcut: a custom property set on an element cannot escape it, so
 * the subtree re-tints and nothing outside can. The operator-app prohibition is enforced by CSS
 * scoping rather than by convention.
 */
type CssVars = CSSProperties & Record<`--${string}`, string>;

/**
 * The tokens whose value differs by scheme. Written inline under their own name, a light value
 * would outrank the dark rule; so they ride as `--tenant-light-*` and `CustomerSurface.css` picks
 * the light or the dark one.
 */
const SCHEME_TOKENS = new Set([
  '--accent-subtle',
  '--accent-text',
  '--link',
  '--link-hover',
  '--focus-ring',
]);

function inlineVars(tokens: TenantTokens): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tokens).map(([name, value]) => [
      SCHEME_TOKENS.has(name) ? name.replace('--', '--tenant-light-') : name,
      value,
    ]),
  );
}

interface WebCustomerSurfaceProps extends CustomerSurfaceProps {
  /** Element to render. Default `div`; `main` or a body-level wrapper on a real link page. */
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
}

/**
 * The scope a tenant's brand colour reaches — the other half of `F7-07`.
 *
 * The scope is this element and its subtree: bigger than one frame, smaller than the app.
 * Mounting it is a deliberate act on a customer-facing route; there is no global switch that
 * could turn tenant branding on by accident, and no component anywhere reads a tenant colour by
 * itself.
 *
 * The contrast obligation travels with the scope (`N4` / `F7-11`) — see `tenant-tokens.ts`: the
 * raw colour is never given to anything that carries words.
 */
export function CustomerSurface({
  brandColor,
  tenantName,
  as = 'div',
  fullHeight = false,
  children,
  className,
  style,
}: WebCustomerSurfaceProps) {
  const tokens = tenantTokens(brandColor);
  const vars: CssVars = { ...(tokens === null ? {} : inlineVars(tokens)), ...style };
  return createElement(
    as,
    {
      'data-customer-surface': '',
      'data-tenant': tenantName === undefined || tenantName === '' ? undefined : tenantName,
      'data-full-height': fullHeight ? 'true' : undefined,
      /* Present only while a tenant colour is in force: the dark scheme's rules key on it. */
      'data-branded': tokens === null ? undefined : '',
      className: classNames('hg-customer-surface', className),
      style: vars,
    },
    children,
  );
}

/** What the tenant colour resolved to, for a surface that needs the values directly. */
CustomerSurface.tokens = tenantTokens;
