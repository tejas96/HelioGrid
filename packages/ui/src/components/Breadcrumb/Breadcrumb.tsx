import type { CSSProperties } from 'react';
import type { BreadcrumbItem, BreadcrumbProps } from './Breadcrumb.types';

interface WebBreadcrumbProps extends BreadcrumbProps {
  className?: string;
  style?: CSSProperties;
}

/** The collapsed middle is a crumb too — it renders as a static "…" carrying the hidden trail. */
interface Crumb extends BreadcrumbItem {
  ellipsis?: boolean;
}

/**
 * Where you are in a 13-module product. Long trails collapse in the MIDDLE, never at the ends —
 * the root and the current page always stay readable.
 *
 * There is no native half. The reason is the POINTER SURFACE waiver in `Breadcrumb.types.ts`,
 * which is where `ds:check` reads it and therefore the only place it counts; do not restate it
 * here as an independent claim.
 *
 * THE TARGET AND THE VISIBLE LINE ARE TWO DIFFERENT RECTANGLES. Each crumb is a 44px-tall
 * button whose extra height is taken back as negative margin (-10px), so the rendered trail
 * stays a 24px line while the hit area clears the floor. A negative margin borrows layout
 * space back; it does not shrink a hit box.
 */
export function Breadcrumb({
  items,
  maxItems = 4,
  onNavigate,
  className,
  style,
}: WebBreadcrumbProps) {
  const root = items[0];
  const collapse = items.length > maxItems && root !== undefined;
  const shown: Crumb[] = collapse
    ? [root, { key: '…', label: '…', ellipsis: true }, ...items.slice(-2)]
    : items;
  /* The tooltip on the "…" is the only place the collapsed labels still exist. */
  const hidden = items
    .slice(1, -2)
    .map((item) => item.label)
    .join(' / ');

  return (
    <nav aria-label="Breadcrumb" className={className} style={style}>
      <ol className="hg-breadcrumb-list">
        {shown.map((item, index) => {
          const last = index === shown.length - 1;
          return (
            <li key={item.key ?? item.label} className="hg-breadcrumb-item">
              {index > 0 ? (
                <span aria-hidden="true" className="hg-breadcrumb-separator">
                  /
                </span>
              ) : null}
              {last || item.ellipsis === true ? (
                <span
                  aria-current={last ? 'page' : undefined}
                  title={item.ellipsis === true ? hidden : undefined}
                  className="hg-breadcrumb-static"
                  data-current={last ? 'true' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  className="hg-breadcrumb-link"
                  onClick={() => {
                    if (item.onClick !== undefined) {
                      item.onClick();
                      return;
                    }
                    onNavigate?.(item);
                  }}
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
