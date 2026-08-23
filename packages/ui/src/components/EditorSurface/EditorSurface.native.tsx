import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { DetailPanel } from '../DetailPanel/DetailPanel.native';
import { Modal } from '../Modal/Modal.native';
import { Sheet } from '../Sheet/Sheet.native';
import { SheetActions } from '../Sheet/SheetActions.native';
import type { EditorSurfaceProps } from './EditorSurface.types';
import {
  isDecision,
  isPanel,
  modalChrome,
  PANEL_ABOVE,
  panelChrome,
  resolveEditorBody,
  sheetChrome,
} from './editor-form-props';
import { editorStateProps } from './editor-state-props';
import { PROBE_STYLE, useEditorForm, useLayerWidth } from './use-editor-form.native';

interface NativeEditorSurfaceProps extends EditorSurfaceProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * `F7-21`'s one sheet grammar, PERFORMED instead of described: a sheet on mobile, a side panel on
 * desktop — sheets, not pages. Every editor in the product mounts this instead of picking a form.
 *
 * **The measurement is the layer's own width, never a hardcoded phone assumption.** A tablet in
 * landscape crosses 720 and gets the panel; a phone never does. Under `inset` a zero-height probe
 * measures the ancestor instead, so a device frame inside a specimen gets the sheet.
 *
 * **A decision takes the same switch with a different desktop form.** `desktop="modal"` renders a
 * centred `Modal` above the breakpoint and the same `Sheet` below it. `modal={false}` is not
 * honoured there.
 */
export function EditorSurface(props: NativeEditorSurfaceProps) {
  const {
    open = false,
    onClose,
    panelAbove = PANEL_ABOVE,
    title,
    subtitle,
    overline,
    children,
    footer,
    modal = true,
    desktop = 'panel',
    side = 'right',
    width = 480,
    dismissible = true,
    leading = null,
    meta = null,
    inset = false,
    zIndex = 40,
    sheetProps = {},
    panelProps = {},
    modalProps = {},
    style,
  } = props;

  const { onLayout, width: layerWidth } = useLayerWidth(inset);
  /* Only `inset` needs a real probe: without it the layer IS the Portal host, whose width is the
     window's. Rendering the probe unconditionally would add a zero-height View to every screen. */
  const probe = inset ? <View onLayout={onLayout} style={PROBE_STYLE} /> : null;
  const panel = isPanel(layerWidth, panelAbove);
  const body: ReactNode = resolveEditorBody(children, panel, layerWidth);

  if (!open || panel === null) {
    return probe;
  }

  /* A DECISION'S DESKTOP FORM IS CENTRED, NOT AN EDGE DRAWER. Modal is modal by definition, so
     `modal={false}` is not honoured here. `tone`, `icon` and `size` ride `modalProps`. */
  if (isDecision(panel, desktop)) {
    return (
      <>
        {probe}
        <Modal
          {...modalChrome(props)}
          description={subtitle}
          dismissible={dismissible}
          footer={footer}
          onClose={onClose}
          open
          overline={overline}
          style={style}
          title={title}
          zIndex={zIndex}
          {...modalProps}
        >
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
          {...editorStateProps(props)}
          {...panelChrome(props)}
          dismissible={dismissible}
          footer={footer}
          leading={leading}
          meta={meta}
          modal={modal}
          onClose={onClose}
          open
          overline={overline}
          side={side}
          style={style}
          subtitle={subtitle}
          title={title}
          width={width}
          zIndex={zIndex}
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
      <Sheet
        {...editorStateProps(props)}
        {...sheetChrome(props)}
        dismissible={dismissible}
        footer={footer}
        modal={modal}
        onClose={onClose}
        open
        overline={overline}
        style={style}
        subtitle={subtitle}
        title={title}
        zIndex={zIndex}
        {...sheetProps}
      >
        {body}
      </Sheet>
    </>
  );
}

/** `SheetActions` under the family name — the footer row, stacking below 320dp of its own width. */
EditorSurface.Actions = SheetActions;
EditorSurface.useEditorForm = useEditorForm;
