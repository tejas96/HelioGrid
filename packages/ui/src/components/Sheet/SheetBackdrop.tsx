import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { SheetBackdropProps } from './Sheet.types';

/** The z-index rides in as a custom property so the placement rules stay in Sheet.css. */
type BackdropVars = CSSProperties & Record<`--${string}`, string>;

interface WebSheetBackdropProps extends SheetBackdropProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Backdrop: blurs and desaturates the layer behind, fading it toward white. Never darkens — that
 * inversion is a signature of the system, so this file is the only place the recipe lives.
 */
export function SheetBackdrop({
  onClick,
  inset = false,
  zIndex = 40,
  className,
  style,
}: WebSheetBackdropProps) {
  const vars: BackdropVars = { '--hg-sheet-z': `${zIndex}` };
  /* The backdrop is aria-hidden and carries no keyboard route of its own on purpose: Esc and the
     44px close button are the same dismissal, reachable without a pointer. */
  return (
    <div
      aria-hidden="true"
      className={classNames('hg-sheet-backdrop', className)}
      data-inset={inset ? 'true' : 'false'}
      onClick={onClick}
      style={{ ...vars, ...style }}
    />
  );
}
