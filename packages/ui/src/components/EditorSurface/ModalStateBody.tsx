import { type ReactNode, useRef } from 'react';
import { OverlayBody } from '../Sheet/OverlayBody';
import { SheetSkeleton } from '../Sheet/SheetSkeleton';
import type { EditorSurfaceProps } from './EditorSurface.types';
import { modalStateOf } from './modal-state';

/**
 * A decision's centred form draws its read's five states as the sheet and the panel do — loading,
 * empty, failed with *Try again*, unavailable — so a modal never opens on a blank body. An editor
 * with no read draws its body as it stands.
 */
export function ModalStateBody({
  props,
  children,
}: {
  props: EditorSurfaceProps;
  children: ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  if (props.read === undefined) return children;
  return (
    <div ref={frame} tabIndex={-1} className="hg-focus-target">
      <OverlayBody
        {...modalStateOf(props)}
        focusAfter={frame}
        skeleton={<SheetSkeleton density={props.density} label={props.loadingLabel} />}
        unavailableClassName="hg-sheet-unavailable"
      >
        {children}
      </OverlayBody>
    </div>
  );
}
