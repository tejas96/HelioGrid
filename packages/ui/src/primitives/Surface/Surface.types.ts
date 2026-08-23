import type { ReactNode } from 'react';

/** Elevation steps — canvas → card (e2) → control (e4) → overlay (e5). e0 is flat. */
export type Elevation = 'e0' | 'e1' | 'e2' | 'e3' | 'e4' | 'e5';

/** Radius steps; the value each resolves to depends on the density mode. */
export type SurfaceRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Expressive = the brand's extreme radii; functional = the dense working set. */
export type Density = 'expressive' | 'functional';

export type SurfaceBackground = 'surface' | 'surface-alt' | 'canvas' | 'canvas-sunken';

export interface SurfaceProps {
  children?: ReactNode;
  /** Default e0 — flat. Hierarchy comes from luminance and elevation, never borders. */
  elevation?: Elevation;
  radius?: SurfaceRadius;
  density?: Density;
  background?: SurfaceBackground;
}
