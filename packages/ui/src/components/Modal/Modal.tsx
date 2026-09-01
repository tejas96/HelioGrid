import type { CSSProperties } from 'react';
import { useId, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { OverlayClose } from '../Sheet/OverlayClose';
import { SheetBackdrop } from '../Sheet/SheetBackdrop';
import { useOverlayDismiss } from '../Sheet/use-overlay-dismiss';
import type { ModalProps } from './Modal.types';
import { ModalMark } from './ModalMark';

/** The z-index is a live number; the rest of the geometry stays in Modal.css. */
type ModalVars = CSSProperties & Record<`--${string}`, string>;

interface WebModalProps extends ModalProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Centred dialog for decisions. Springs in with a 12px rise and 0.97 scale over the same
 * white-fading blurred backdrop as `Sheet`. It is the **desktop** form; the phone answer is a
 * `Sheet`.
 *
 * **A decision reached from a screen mounts `EditorSurface` with `desktop="modal"`, not this.**
 * That component performs `F7-21`'s switch off the layer's own width and renders this as the
 * desktop half, so no screen has to remember to swap a Modal for a Sheet at 720px. Mount `Modal`
 * directly only where you own the switch yourself.
 *
 * **There is deliberately no `modal={false}` here.** `Sheet` and `DetailPanel` have one because an
 * editor's subject can be the thing behind it; a decision that must be answered cannot be — so
 * this component is always `aria-modal`, always backdropped, always scroll-locked.
 */
export function Modal({
  open = true,
  onClose,
  title,
  labelId,
  description,
  overline,
  children,
  size = 'md',
  density = 'expressive',
  tone = 'neutral',
  icon,
  footer = null,
  showClose = true,
  dismissible = true,
  inset = false,
  zIndex = 60,
  className,
  style,
}: WebModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const autoId = useId();

  useOverlayDismiss({ open, panelRef, dismissible, onClose, modal: true, inset });

  if (!open) {
    return null;
  }

  const vars: ModalVars = { '--hg-modal-z': `${zIndex}` };
  const roomy = children !== undefined || description !== undefined;

  return (
    <>
      <SheetBackdrop inset={inset} onClick={dismissible ? onClose : undefined} zIndex={zIndex} />
      <div className="hg-modal-layer" data-inset={inset ? 'true' : 'false'} style={vars}>
        <div
          aria-labelledby={labelId ?? (title === undefined ? undefined : autoId)}
          aria-modal="true"
          className={classNames('hg-modal', className)}
          data-density={density}
          data-size={size}
          ref={panelRef}
          role="dialog"
          style={style}
          tabIndex={-1}
        >
          <div className="hg-modal-header">
            <ModalMark icon={icon} tone={tone} />
            <div className="hg-modal-heading">
              {overline === undefined ? null : <div className="hg-modal-overline">{overline}</div>}
              {title === undefined ? null : (
                <h2 className="hg-modal-title" id={autoId}>
                  {title}
                </h2>
              )}
              {description === undefined ? null : (
                <p className="hg-modal-description">{description}</p>
              )}
            </div>
            {showClose ? <OverlayClose offset="modal" onClick={onClose} /> : null}
          </div>

          {children === undefined ? null : <div className="hg-modal-body">{children}</div>}

          {footer === null ? null : (
            <div className="hg-modal-footer" data-roomy={roomy ? 'true' : 'false'}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
