import {
  EditorSurface,
  PaymentTermsEditor,
  PaymentTermsFoot,
  TERMS_PREVIEW,
  type TermsEditorView,
} from '@heliogrid/ui';

/**
 * The template editor on the phone (`SCR-M01-20` m20-c, m20-c2, m20-c3): a full sheet over the
 * cards, the customer's schedule at its top, the lines, and the meter with *Save terms* in its
 * sticky foot. The sheet lifts itself over the keyboard (`Sheet`), as the phase editor's does.
 */
export function TermsEditorSheet({
  view,
  closeLabel,
  onClose,
}: {
  view: TermsEditorView;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <EditorSurface
      open
      onClose={onClose}
      closeLabel={closeLabel}
      showClose
      size="full"
      density="functional"
      {...(view.overline === undefined ? {} : { overline: view.overline })}
      title={view.title}
      footer={<PaymentTermsFoot {...view.foot} />}
    >
      <PaymentTermsEditor {...view.body} previewHeight={TERMS_PREVIEW.sheetHeight} />
    </EditorSurface>
  );
}
