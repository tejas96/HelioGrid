import type { PaymentTermsWords } from '@heliogrid/i18n';
import {
  EditorSurface,
  PaymentTermsEditor,
  PaymentTermsFoot,
  PaymentTermsPicker,
  PaymentTermsPickerFoot,
  TERMS_PREVIEW,
  type TermsEditorView,
} from '@heliogrid/ui';
import { useRef } from 'react';

type TermsPickerView = NonNullable<TermsEditorView['picker']>;

/** The sheet's room from which it stands as a side panel instead (`SCR-M01-20` RFC §6). */
const PANEL_ABOVE = 720;

/** The picker's sheet stands above the editor's, which stays open under it. */
const PICKER_LAYER = 50;

/**
 * The editor below width (`SCR-M01-20` m20-c … m20-d): a full sheet whose foot is the meter and
 * *Save terms*, and the stage picker chained above it — ✕ and *Done* go back to the editor.
 * A closing sheet keeps what it last drew, so nothing empties while it slides away.
 */
export function TermsEditorSheet({
  view,
  words,
  closeLabel,
  onClose,
  onDonePicking,
}: {
  view: TermsEditorView | null;
  words: PaymentTermsWords;
  closeLabel: string;
  onClose: () => void;
  onDonePicking: () => void;
}) {
  const lastView = useRef<TermsEditorView | null>(null);
  const lastPicker = useRef<TermsPickerView | null>(null);
  if (view !== null) lastView.current = view;
  if (view?.picker != null) lastPicker.current = view.picker;
  const shown = lastView.current;
  const picker = lastPicker.current;
  return (
    <>
      <EditorSurface
        open={view !== null}
        onClose={onClose}
        closeLabel={closeLabel}
        showClose
        density="functional"
        size="full"
        panelAbove={PANEL_ABOVE}
        overline={shown?.overline}
        title={shown?.title}
        footer={shown === null ? null : <PaymentTermsFoot {...shown.foot} />}
      >
        {shown === null ? null : (
          <PaymentTermsEditor {...shown.body} previewHeight={TERMS_PREVIEW.sheetHeight} />
        )}
      </EditorSurface>
      <EditorSurface
        open={view?.picker != null}
        onClose={onDonePicking}
        closeLabel={closeLabel}
        showClose
        density="functional"
        size="full"
        panelAbove={PANEL_ABOVE}
        zIndex={PICKER_LAYER}
        overline={picker?.overline}
        title={words.pickerTitle}
        footer={<PaymentTermsPickerFoot words={words} onDone={onDonePicking} />}
      >
        {picker === null ? null : <PaymentTermsPicker {...picker.body} />}
      </EditorSurface>
    </>
  );
}
