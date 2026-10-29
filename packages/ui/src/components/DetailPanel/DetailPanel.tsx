import type { CSSProperties, UIEvent } from 'react';
import { useId, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { OverlayBody } from '../Sheet/OverlayBody';
import { isBodyScrolled } from '../Sheet/Sheet.logic';
import { SheetBackdrop } from '../Sheet/SheetBackdrop';
import { readFrameClass } from '../Sheet/sheet-attrs';
import { useOverlayDismiss } from '../Sheet/use-overlay-dismiss';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import type { DetailPanelProps } from './DetailPanel.types';
import { PanelHeader } from './PanelHeader';
import { PanelSkeleton } from './PanelSkeleton';

/** The live numbers — z-index, the panel's width and its top — ride in as custom properties. */
type PanelVars = CSSProperties & Record<`--${string}`, string>;

type WebDetailPanelProps = DetailPanelProps & {
  className?: string;
  style?: CSSProperties;
};

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
  closeLabel,
  side = 'right',
  width = 480,
  top = '0px',
  title,
  status,
  subtitle,
  subtitleFace = 'mono',
  overline,
  leading = null,
  meta = null,
  children,
  density = 'functional',
  footer = null,
  showClose = true,
  dismissible = true,
  modal = true,
  read,
  loadingLabel,
  errorTitle,
  errorMessage,
  retryLabel,
  emptyTitle,
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
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);
  const panelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const titleId = useId();

  useOverlayDismiss({ open, panelRef, dismissible, onClose, modal, inset });

  if (!open) {
    return null;
  }

  const vars: PanelVars = {
    '--hg-panel-z': `${zIndex}`,
    '--hg-panel-w': `${width}px`,
    '--hg-panel-top': top,
  };

  return (
    <>
      {modal ? (
        <SheetBackdrop inset={inset} onClick={dismissible ? onClose : undefined} zIndex={zIndex} />
      ) : null}
      <div
        aria-labelledby={title === undefined ? undefined : titleId}
        aria-modal={modal ? 'true' : undefined}
        className={classNames('hg-detail-panel', readFrameClass(read), className)}
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
          closeLabel={closeLabel}
          onClose={onClose}
          overline={overline}
          scrolled={scrolled}
          showClose={showClose}
          status={status}
          subtitle={subtitle}
          subtitleFace={subtitleFace}
          title={title}
          titleId={titleId}
        />

        {meta === null ? null : <div className="hg-detail-panel-meta">{meta}</div>}

        <div
          className="hg-detail-panel-body"
          data-footer={footer === null ? 'false' : 'true'}
          onScroll={(event: UIEvent<HTMLDivElement>) =>
            setScrolled(isBodyScrolled(event.currentTarget.scrollTop))
          }
        >
          <OverlayBody
            emptyAction={emptyAction}
            emptyMessage={emptyMessage}
            emptyTitle={emptyTitle}
            errorMessage={errorMessage}
            errorTitle={errorTitle}
            onRetry={onRetry}
            retryLabel={retryLabel}
            focusAfter={panelRef}
            skeleton={<PanelSkeleton label={loadingLabel} />}
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
