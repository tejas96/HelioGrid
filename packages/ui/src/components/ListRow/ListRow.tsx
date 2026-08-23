import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { IconCircle } from '../Card';
import { renderMarks } from '../ChipGroup';
import { renderGap } from '../NamedGap';
import { renderPending } from '../PendingAction';
import { renderProvenance } from '../Provenance';
import { renderAttribution } from '../ValueSource';
import { isPendingInFlight } from './ListRow.pending';
import type { ListRowProps } from './ListRow.types';

interface WebListRowProps extends ListRowProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * List row: circular leading, two-line text, provenance slot, trailing action. No divider lines.
 *
 * At rest it reads `--surface-edge` — `none` in the base scope, the sanctioned hairline in
 * high-contrast field mode. Its edge is **not** hover-only; nothing in this system is.
 *
 * Three slots are law rather than layout: the provenance TIER has a declared slot (the third line
 * of the text column, so a tier never competes with the action in `trailing`), an absent subtitle
 * is a NAMED GAP rather than a blank line, and an act in flight is a LINE rather than a dim.
 */
export function ListRow({
  icon,
  iconColor = 'var(--accent)',
  avatar,
  title,
  subtitle,
  gap,
  marks,
  provenance,
  attribution,
  pending,
  trailing,
  density = 'expressive',
  onClick,
  className,
  style,
}: WebListRowProps) {
  const isExpr = density === 'expressive';
  const gapNode = renderGap(gap, { scale: 'field' });
  const prov = renderProvenance(provenance, { size: 12 });
  const attr = renderAttribution(attribution, { size: 12 });
  const pend = renderPending(pending);
  return (
    /* The DS row is a PLAIN DIV by design: its `trailing` slot carries real controls, and a
       role="button" wrapper would nest them invalidly — the exact defect RecordCard's
       sibling-overlay button exists to avoid. Ported as the design system draws it. */
    // biome-ignore lint/a11y/noStaticElementInteractions: see above — DS markup, ported as-is.
    // biome-ignore lint/a11y/useKeyWithClickEvents: see above — DS markup, ported as-is.
    <div
      className={classNames('hg-list-row', className)}
      data-density={density}
      data-clickable={onClick ? 'true' : undefined}
      aria-busy={isPendingInFlight(pending) ? 'true' : undefined}
      onClick={onClick}
      style={style}
    >
      {avatar ||
        (icon ? (
          <IconCircle color={iconColor} size={isExpr ? 40 : 32}>
            {icon}
          </IconCircle>
        ) : null)}
      <div className="hg-list-row-body">
        <div className="hg-list-row-title">{title}</div>
        {gapNode ? (
          <div className="hg-list-row-gap">{gapNode}</div>
        ) : subtitle ? (
          <div className="hg-list-row-subtitle">{subtitle}</div>
        ) : null}
        {marks ? <div className="hg-list-row-marks">{renderMarks(marks)}</div> : null}
        {attr ? <div className="hg-list-row-attribution">{attr}</div> : null}
        {prov ? <div className="hg-list-row-provenance">{prov}</div> : null}
        {pend ? <div className="hg-list-row-pending">{pend}</div> : null}
      </div>
      {trailing}
    </div>
  );
}
