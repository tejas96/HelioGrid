import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { IconButton } from '../IconButton/IconButton';
import { PaymentTermsEditor } from './PaymentTermsEditor';
import { PaymentTermsFoot } from './PaymentTermsFoot';
import { PaymentTermsPicker, PaymentTermsPickerFoot } from './PaymentTermsPicker';
import { TERMS_PREVIEW } from './PaymentTermsSettings.logic';
import type { PaymentTermsEditorCardProps } from './PaymentTermsSettings.view';

/**
 * The editor at width (`SCR-M01-20` m20-g, m20-n10, m20-n11): a 440 card beside the cards — the
 * overline while changed, the name, the body, a rule and the foot. While a line's stage is picked
 * (m20-h) the picker takes the card's body, with a way back to the editor.
 */
export function PaymentTermsEditorCard({
  view,
  words,
  onDonePicking,
}: PaymentTermsEditorCardProps) {
  const { picker } = view;
  if (picker !== null) {
    return (
      <section className="hg-pay-editor-card" aria-label={words.pickerTitle}>
        <div className="hg-pay-editor-card-back">
          <IconButton
            label={words.backTo(view.title)}
            size={40}
            variant="surface"
            onClick={onDonePicking}
          >
            <ShellGlyph name="chevron-left" size="md" tone="primary" />
          </IconButton>
          <div className="hg-pay-editor-card-head">
            <Text variant="overline" color="secondary">
              {picker.overline}
            </Text>
            <Text as="h2" variant="body" bold>
              {words.pickerTitle}
            </Text>
          </div>
        </div>
        <PaymentTermsPicker {...picker.body} />
        <div className="hg-pay-rule" />
        <PaymentTermsPickerFoot words={words} onDone={onDonePicking} />
      </section>
    );
  }
  return (
    <section className="hg-pay-editor-card" aria-label={words.edit(view.title)}>
      <div className="hg-pay-editor-card-head">
        {view.overline === undefined ? null : (
          <Text variant="overline" color="secondary">
            {view.overline}
          </Text>
        )}
        <Text as="h2" variant="body" bold>
          {view.title}
        </Text>
      </div>
      <PaymentTermsEditor {...view.body} previewHeight={TERMS_PREVIEW.cardHeight} />
      <div className="hg-pay-rule" />
      <PaymentTermsFoot {...view.foot} />
    </section>
  );
}
