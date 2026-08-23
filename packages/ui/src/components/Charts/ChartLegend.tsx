import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ChartLegendProps } from './Charts.types';
import { chartSlot } from './chart-palette';

interface WebChartLegendProps extends ChartLegendProps {
  className?: string;
  style?: CSSProperties;
}

/** The series key: a palette swatch, the label, and — when there is one — the value. */
export function ChartLegend({ items, className, style }: WebChartLegendProps) {
  return (
    <ul className={classNames('hg-charts-legend', className)} style={style}>
      {items.map((item, index) => (
        <li key={item.label} className="hg-charts-legend-item">
          <span
            aria-hidden="true"
            className="hg-charts-legend-dot hg-charts-slot"
            data-slot={item.color === undefined ? chartSlot(index) : undefined}
            style={item.color === undefined ? undefined : { background: item.color }}
          />
          <span>{item.label}</span>
          {item.value === undefined || item.value === null ? null : (
            <span className="hg-charts-legend-value">{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
