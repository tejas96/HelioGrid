import type { CSSProperties, UIEvent } from 'react';
import { useId, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { OverlayBody } from '../Sheet/OverlayBody';
import { SheetBackdrop } from '../Sheet/SheetBackdrop';
import { useOverlayDismiss } from '../Sheet/use-overlay-dismiss';
import type { DetailPanelProps } from './DetailPanel.types';
import { PanelHeader } from './PanelHeader';
import { PanelSkeleton } from './PanelSkeleton';

/** The two live numbers — z-index and the panel's own width — ride in as custom properties. */
type PanelVars = CSSProperties & Record<`--${string}`, string>;

interface WebDetailPanelProps extends DetailPanelProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Right-edge master-detail drawer (480px default). Same backdrop law as `Sheet` — blurs the layer
 * behind and fades it toward white, never a dark scrim. Slides from the edge, e5.
 *
 * **An editor mounts `EditorSurface`, not this.** That component performs `F7-21`'s
 * sheet-on-mobile / panel-on-desktop switch off the layer's own width and renders this as the
 * desktop half. Mount `DetailPanel` directly for a drawer that is a drawer at every width.
 *
 * **Its width is `min(width, 100%)` and there is no second breakpoint here.** In a container
 * narrower than `width` the panel simply fills it; the sheet-or-panel decision belongs to
 * `EditorSurface`, which measures the layer at 720 and is the only place that number lives.
 *
 * **Modal and non-modal move three things together** — the backdrop, the focus trap and the body
 * scroll lock — and all three are implemented here. The lock is skipped under `inset` too: an
 * inset panel lives in a specimen card or a device frame, not in the document.
 */
export function DetailPanel({
  open = true,
  onClose,
  side = 'right',
  width = 480,
  title,
  subtitle,
  overline,
  leading = null,
  meta = null,
  children,
  density = 'functional',
  footer = null,
  showClose = true,
  dismissible = true,
  modal = true,
  state = 'ready',
  errorTitle = "Couldn't load this record",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  emptyAction = null,
  unavailableTitle,
  unavailableMessage,
  unavailableAction = null,
  inset = false,
  zIndex = 50,
  className,
  style,
}: WebDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const titleId = useId();

  useOverlayDismiss({ open, panelRef, dismissible, onClose, modal, inset });

  if (!open) {
    return null;
  }

  const vars: PanelVars = { '--hg-panel-z': `${zIndex}`, '--hg-panel-w': `${width}px` };

  return (
    <>
      {modal ? (
        <SheetBackdrop inset={inset} onClick={dismissible ? onClose : undefined} zIndex={zIndex} />
      ) : null}
      <div
        aria-labelledby={title === undefined ? undefined : titleId}
        aria-modal={modal ? 'true' : undefined}
        className={classNames('hg-detail-panel', className)}
        data-density={density}
        data-inset={inset ? 'true' : 'false'}
        data-side={side}
        ref={panelRef}
        role="dialog"
        style={{ ...vars, ...style }}
        tabIndex={-1}
      >
        <PanelHeader
          leading={leading}
          onClose={onClose}
          overline={overline}
          scrolled={scrolled}
          showClose={showClose}
          subtitle={subtitle}
          title={title}
          titleId={titleId}
        />

        {meta === null ? null : <div className="hg-detail-panel-meta">{meta}</div>}

        <div
          className="hg-detail-panel-body"
          data-footer={footer === null ? 'false' : 'true'}
          onScroll={(event: UIEvent<HTMLDivElement>) =>
            setScrolled(event.currentTarget.scrollTop > 2)
          }
        >
          <OverlayBody
            emptyAction={emptyAction}
            emptyMessage={emptyMessage}
            emptyTitle={emptyTitle}
            errorMessage={errorMessage}
            errorTitle={errorTitle}
            onRetry={onRetry}
            skeleton={<PanelSkeleton />}
            state={state}
            unavailableAction={unavailableAction}
            unavailableClassName="hg-detail-panel-unavailable"
            unavailableMessage={unavailableMessage}
            unavailableTitle={unavailableTitle}
            variant="panel"
          >
            {children}
          </OverlayBody>
        </div>

        {footer === null ? null : (
          <div className="hg-detail-panel-footer">
            <div aria-hidden="true" className="hg-detail-panel-footer-fade" />
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
