import type { PaymentTermsScreen } from '@heliogrid/data/react';
import { paymentTermsEditorSaid, paymentTermsWords, SHELL, stageWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { termsContextOf, termsEditorViewOf, termsLetterheadOf, useFormat } from '@heliogrid/ui';

/**
 * The open payment-terms editor as its sheet and its card draw it (`SCR-M01-20`): the one assembly
 * of the editor's view from `usePaymentTermsScreen`, which Payment terms and Proposal defaults both
 * mount — a plan is edited one way wherever it is opened (`T-M01-030`).
 */
export function useTermsEditor(screen: PaymentTermsScreen) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const { page } = screen;
  const editor = page.editor;
  const words = paymentTermsWords(t);
  const context = termsContextOf(words, stageWords(t), locale, format);
  const view =
    editor === null
      ? null
      : termsEditorViewOf({
          editor,
          context,
          letterhead: termsLetterheadOf(page.cover, page.brandColour, format.pack.taxIdLabel),
          said: paymentTermsEditorSaid(t, editor),
          picking: screen.picking,
          acting: page.acting === 'restore' ? null : page.acting,
          acts: {
            edit: page.edit,
            save: page.save,
            makeDefault: (id) => page.act(id, 'make-default'),
            pickStage: screen.pickStage,
            askArchive: screen.askArchive,
            cancel: screen.closeEditor,
          },
        });
  return { view, words, context, closeLabel: t(SHELL.close) };
}
