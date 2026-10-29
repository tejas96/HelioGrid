import type { TranslatedText } from '@heliogrid/contracts';
import type { PaymentTermsWords } from '@heliogrid/i18n';
import {
  EditorSurface,
  PaymentTermsPicker,
  PaymentTermsPickerFoot,
  type TermsEditorView,
} from '@heliogrid/ui';

/**
 * *When is it due?* on the phone (`SCR-M01-20` m20-d): a sheet chained above the editor, opened
 * after it, so it stands on top; ✕ and *Done* close back to the editor. A pick lands in the draft
 * at once — nothing reaches the server before *Save terms*.
 */
export function TermsStageSheet({
  picker,
  words,
  closeLabel,
  onClose,
}: {
  /** The open line's picker; `null` while the picker is shut. */
  picker: TermsEditorView['picker'];
  words: PaymentTermsWords;
  closeLabel: TranslatedText;
  onClose: () => void;
}) {
  if (picker === null) return null;
  return (
    <EditorSurface
      open
      onClose={onClose}
      closeLabel={closeLabel}
      showClose
      size="full"
      density="functional"
      overline={picker.overline}
      title={words.pickerTitle}
      footer={<PaymentTermsPickerFoot words={words} onDone={onClose} />}
    >
      <PaymentTermsPicker {...picker.body} />
    </EditorSurface>
  );
}
