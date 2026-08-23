import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { BlockGridProps } from './Block.types';

interface WebBlockGridProps extends BlockGridProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The seam (`M13-10`). Blocks composed into one screen sit on this grid, so a screen can host
 * foreign today-blocks without the layout breaking.
 */
export function BlockGrid({
  children,
  min = 320,
  gap = 20,
  columns,
  className,
  style,
}: WebBlockGridProps) {
  const vars = {
    '--hg-block-grid-min': `${min}px`,
    '--hg-block-grid-gap': `${gap}px`,
    '--hg-block-grid-columns': columns !== undefined ? `${columns}` : undefined,
  } as CSSProperties;
  return (
    <div
      className={classNames('hg-block-grid', className)}
      data-columns={columns !== undefined ? 'true' : undefined}
      style={{ ...vars, ...style }}
    >
      {children}
    </div>
  );
}
