import type { CSSProperties, ReactNode } from 'react';
import { DetailPanel } from '../DetailPanel/DetailPanel';
import { Modal } from '../Modal/Modal';
import { Sheet } from '../Sheet/Sheet';
import { SheetActions } from '../Sheet/SheetActions';
import type { EditorSurfaceProps } from './EditorSurface.types';
import {
  isDecision,
  isPanel,
  modalFormProps,
  PANEL_ABOVE,
  panelFormProps,
  resolveForForm,
  sheetFormProps,
} from './editor-form-props';
import { probeStyleFor, useEditorForm, useLayerWidth } from './use-editor-form';

type WebEditorSurfaceProps = EditorSurfaceProps & {
  style?: CSSProperties;
};

/**
 * `F7-21`'s one sheet grammar, PERFORMED instead of described: a sheet on mobile, a side panel on
 * desktop — sheets, not pages. Every editor in the product mounts this instead of picking a form;
 * `Sheet` and `DetailPanel` are the two forms it renders.
 *
 * **The measurement is the layer's own width, never the viewport.** A zero-height probe sits in
 * the exact coordinate space the overlay will use, so a 375px device frame on a 1440px desktop
 * gets the sheet. The probe is mounted whether or not the editor is open, and nothing renders
 * before the first measurement — the editor is never drawn in the wrong form and swapped.
 *
 * **A decision takes the same switch with a different desktop form.** `desktop="modal"` renders a
 * centred `Modal` above the breakpoint and the same `Sheet` below it, because nothing is being
 * browsed beside a confirm. `modal={false}` is not honoured there.
 */
export function EditorSurface(props: WebEditorSurfaceProps) {
  const {
    open = false,
    panelAbove = PANEL_ABOVE,
    children,
    desktop = 'panel',
    meta = null,
    inset = false,
    sheetProps = {},
    panelProps = {},
    modalProps = {},
    style,
  } = props;

  const [probeRef, layerWidth] = useLayerWidth();
  const probe = <div aria-hidden="true" ref={probeRef} style={probeStyleFor(inset)} />;
  const panel = isPanel(layerWidth, panelAbove);
  const body: ReactNode = resolveForForm(children, panel, layerWidth);
  const metaRow: ReactNode = resolveForForm(meta, panel, layerWidth);

  if (!open || panel === null) {
    return probe;
  }

  /* A DECISION'S DESKTOP FORM IS CENTRED, NOT AN EDGE DRAWER. Modal is modal by definition, so
     `modal={false}` is not honoured here — a confirm with a live page behind it has no correct
     answer. `tone`, `icon` and `size` are Modal's own chrome and ride `modalProps`. */
  if (isDecision(panel, desktop)) {
    return (
      <>
        {probe}
        <Modal {...modalFormProps(props)} inset={inset} style={style} {...modalProps}>
          {body}
        </Modal>
      </>
    );
  }

  if (panel) {
    return (
      <>
        {probe}
        <DetailPanel
          {...panelFormProps(props, metaRow)}
          inset={inset}
          style={style}
          {...panelProps}
        >
          {body}
        </DetailPanel>
      </>
    );
  }

  return (
    <>
      {probe}
      <Sheet {...sheetFormProps(props, metaRow)} inset={inset} style={style} {...sheetProps}>
        {body}
      </Sheet>
    </>
  );
}

/** `SheetActions` under the family name — the footer row, stacking below 320px of its own width. */
EditorSurface.Actions = SheetActions;
EditorSurface.useEditorForm = useEditorForm;
