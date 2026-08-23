import { classNames } from '../class-names';
import type { SurfaceProps } from './Surface.types';

interface WebSurfaceProps extends SurfaceProps {
  className?: string;
}

/** Elevation, density-resolved radius and background — all token values, in Surface.css. */
export function Surface({
  children,
  elevation = 'e0',
  radius,
  density = 'expressive',
  background = 'surface',
  className,
}: WebSurfaceProps) {
  return (
    <div
      className={classNames('hg-surface', className)}
      data-elevation={elevation}
      data-radius={radius}
      data-density={density}
      data-background={background}
    >
      {children}
    </div>
  );
}
