import type { CSSProperties, UIEvent } from 'react';
import { useId, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { OverlayBody } from './OverlayBody';
import type { SheetProps } from './Sheet.types';
import { SheetBackdrop } from './SheetBackdrop';
import { SheetHandle } from './SheetHandle';
import { SheetHeader } from './SheetHeader';
import { SheetSkeleton } from './SheetSkeleton';
import { sheetBodyAttrs, sheetPanelAttrs } from './sheet-attrs';
import { useOverlayDismiss } from './use-overlay-dismiss';
import { useSheetDrag } from './use-sheet-drag';

/** Panel geometry that is a live number — z-index and the drag offset — rides in as vars. */
type SheetVars = CSSProperties & Record<`--${string}`, string>;

interface WebSheetProps extends SheetProps {
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

/**
 * Bottom sheet — the system's primary overlay (≈180 screens). The backdrop blurs the layer behind
 * and fades it toward white; never a dark scrim. Springs from the bottom edge, 32px top radius
 * (16px functional), e5. Traps focus, restores it on close, closes on Esc.
 *
 * **Two callers, one preferred.** An editor mounts `EditorSurface`, which performs `F7-21`'s
 * sheet-on-mobile / panel-on-desktop switch and renders this. Mount `Sheet` directly only for a
 * surface that is a sheet by nature at every width. With `modal={false}` the backdrop, the focus
 * trap and the scroll lock all go — see `EditorSurface` for what that variant is for.
 *
 * **Its states are the system's five** (`SurfaceState`), not a private three: a record the market
 * pack does not cover is `unavailable` — neutral, no retry — and a section with none yet is
 * `empty`, which invites (law 1).
 */
export function Sheet({
  open = true,
  onClose,
  title,
  subtitle,
  overline,
  children,
  size = 'auto',
  density = 'expressive',
  handle = true,
  showClose = false,
  dismissible = true,
  dragToDismiss = true,
  modal = true,
  footer = null,
  state = 'ready',
  errorTitle = "Couldn't load this",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  emptyAction = null,
  unavailableTitle,
  unavailableMessage,
  unavailableAction = null,
  inset = false,
  zIndex = 40,
  labelId,
  className,
  style,
  bodyStyle,
}: WebSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const autoId = useId();
  /* A caller's own heading names the dialog when there is no `title` — without this the prop could
     only rename an id that already existed, and an icon-header dialog had no name at all. */
  const titleId = labelId ?? `${autoId}-title`;
  const namedBy = labelId ?? (title === undefined ? undefined : titleId);
  const draggable = dragToDismiss && dismissible;
  const { dragY, dragging, onPointerDown } = useSheetDrag(bodyRef, draggable, onClose);

  useOverlayDismiss({ open, panelRef, dismissible, onClose, modal, inset });

  if (!open) {
    return null;
  }

  const hasHeader = title !== undefined || overline !== undefined || showClose;
  const vars: SheetVars = { '--hg-sheet-z': `${zIndex}`, '--hg-sheet-drag': `${dragY}px` };

  return (
    <>
      {modal ? (
        <SheetBackdrop inset={inset} onClick={dismissible ? onClose : undefined} zIndex={zIndex} />
      ) : null}
      <div
        {...sheetPanelAttrs({ density, dragY, dragging, inset, size })}
        aria-labelledby={namedBy}
        aria-modal={modal ? 'true' : undefined}
        className={classNames('hg-sheet', className)}
        ref={panelRef}
        role="dialog"
        style={{ ...vars, ...style }}
        tabIndex={-1}
      >
        {handle ? (
          <SheetHandle draggable={draggable} hasHeader={hasHeader} onPointerDown={onPointerDown} />
        ) : null}

        {hasHeader ? (
          <SheetHeader
            handle={handle}
            onClose={onClose}
            onPointerDown={handle ? undefined : onPointerDown}
            overline={overline}
            scrolled={scrolled}
            showClose={showClose}
            subtitle={subtitle}
            title={title}
            titleId={titleId}
          />
        ) : null}

        <div
          {...sheetBodyAttrs(hasHeader, footer !== null)}
          className="hg-sheet-body"
          onScroll={(event: UIEvent<HTMLDivElement>) =>
            setScrolled(event.currentTarget.scrollTop > 2)
          }
          ref={bodyRef}
          style={bodyStyle}
        >
          <OverlayBody
            emptyAction={emptyAction}
            emptyMessage={emptyMessage}
            emptyTitle={emptyTitle}
            errorMessage={errorMessage}
            errorTitle={errorTitle}
            onRetry={onRetry}
            skeleton={<SheetSkeleton density={density} />}
            state={state}
            unavailableAction={unavailableAction}
            unavailableClassName="hg-sheet-unavailable"
            unavailableMessage={unavailableMessage}
            unavailableTitle={unavailableTitle}
            variant="sheet"
          >
            {children}
          </OverlayBody>
        </div>

        {footer === null ? null : (
          <div className="hg-sheet-footer">
            <div aria-hidden="true" className="hg-sheet-footer-fade" />
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
