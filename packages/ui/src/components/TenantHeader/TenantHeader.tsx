import type { CSSProperties, JSX } from 'react';
import { createElement } from 'react';
import { classNames } from '../../primitives/class-names';
import type { TenantHeaderProps, TenantMarkProps } from './TenantHeader.types';
import { isLogoUrl, tenantInitials } from './tenant-initials';

/** Per-instance sizes ride into TenantHeader.css as custom properties. */
type CssVars = CSSProperties & Record<`--${string}`, string>;

interface WebTenantMarkProps extends TenantMarkProps {
  className?: string;
  style?: CSSProperties;
}

interface WebTenantHeaderProps extends TenantHeaderProps {
  /** Element to render. Default `header`. */
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
}

function markVars(size: number, radius: number | undefined, style?: CSSProperties): CssVars {
  return {
    '--hg-tenant-mark-size': `${size}px`,
    '--hg-tenant-mark-radius': `${radius ?? Math.round(size * 0.3)}px`,
    '--hg-tenant-mark-type': `${Math.round(size * 0.42)}px`,
    '--hg-tenant-mark-logo-max': `${size * 3.4}px`,
    ...style,
  };
}

/**
 * The fallback monogram. When the name is also rendered beside it the mark is decorative and is
 * hidden from assistive tech; when it stands alone it IS the identity and carries the name.
 * Two elements rather than one with conditional ARIA, so the role and its label always agree.
 */
function Monogram({ name, showName }: { name: string; showName: boolean }) {
  if (showName) {
    return (
      <span className="hg-tenant-mark-monogram" aria-hidden="true">
        {tenantInitials(name)}
      </span>
    );
  }
  return (
    <span className="hg-tenant-mark-monogram" role="img" aria-label={name}>
      {tenantInitials(name)}
    </span>
  );
}

function TenantMarkGlyph({
  logo,
  name,
  showName,
}: {
  logo: TenantMarkProps['logo'];
  name: string;
  showName: boolean;
}) {
  if (isLogoUrl(logo)) {
    return <img className="hg-tenant-mark-logo" src={logo} alt={showName ? '' : `${name} logo`} />;
  }
  if (logo) {
    return <span className="hg-tenant-mark-node">{logo}</span>;
  }
  return <Monogram name={name} showName={showName} />;
}

/**
 * The mark + name lockup. Inline, one line, sized for a top bar by default.
 *
 * Identity, never theme. The fallback monogram fills with `--tenant-mark`, a token that exists
 * ONLY inside a `CustomerSurface`: on a customer link page it takes the tenant's colour with no
 * prop, and in the operator top bar the token is unset, so it falls back to neutral and the
 * operator chrome looks the same for every tenant.
 *
 * It reads `--tenant-mark`, not the raw `--tenant-brand`, because the monogram is a fill WITH
 * LETTERS ON IT. `CustomerSurface` gates that pair on `bestTextOn(brand).passes`, so this
 * component holds no contrast opinion of its own and cannot disagree with `DocumentPreview`.
 */
export function TenantMark({
  logo,
  name,
  size = 32,
  showName = true,
  meta,
  radius,
  className,
  style,
}: WebTenantMarkProps) {
  return (
    <span className={classNames('hg-tenant-mark', className)} style={markVars(size, radius, style)}>
      <TenantMarkGlyph logo={logo} name={name} showName={showName} />
      {showName ? (
        <span className="hg-tenant-mark-text">
          <span className="hg-tenant-mark-name">{name}</span>
          {meta === undefined ? null : <span className="hg-tenant-mark-meta">{meta}</span>}
        </span>
      ) : null}
    </span>
  );
}

/**
 * The page-level identity band for a customer link page: the tenant's identity, then the page's
 * own words. Mount it inside `CustomerSurface` and the tenant's colour arrives through the token
 * scope with no prop.
 */
export function TenantHeader({
  logo,
  name,
  caption,
  size = 44,
  actions,
  align = 'left',
  as = 'header',
  className,
  style,
}: WebTenantHeaderProps) {
  return createElement(
    as,
    {
      className: classNames('hg-tenant-header', className),
      'data-align': align,
      style,
    },
    <span className="hg-tenant-header-lockup" key="lockup">
      <TenantMark logo={logo} name={name} size={size} showName={false} />
      <span className="hg-tenant-header-text">
        <span className="hg-tenant-header-name">{name}</span>
        {caption === undefined ? null : <span className="hg-tenant-header-caption">{caption}</span>}
      </span>
    </span>,
    actions ? (
      <span className="hg-tenant-header-actions" key="actions">
        {actions}
      </span>
    ) : null,
  );
}

/** The inline lockup, for a top bar. Same component as `TenantMark`. */
TenantHeader.Mark = TenantMark;
