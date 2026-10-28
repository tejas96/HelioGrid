import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, useGround } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { IconButton } from '../IconButton/IconButton.native';
import { PaymentTermsEditor } from './PaymentTermsEditor.native';
import { PaymentTermsFoot } from './PaymentTermsFoot.native';
import { PaymentTermsPicker, PaymentTermsPickerFoot } from './PaymentTermsPicker.native';
import { TERMS_PREVIEW } from './PaymentTermsSettings.logic';
import type { PaymentTermsEditorCardProps } from './PaymentTermsSettings.view';

/**
 * The editor as a card beside the cards (`SCR-M01-20` m20-g, m20-h) — the layout a wide room
 * takes. The phone's one column never passes it (its editor is a sheet); a tablet's room would.
 */
export function PaymentTermsEditorCard({
  view,
  words,
  onDonePicking,
}: PaymentTermsEditorCardProps) {
  const { picker } = view;
  // The card stands on the page, white on white with its shadow: it paints the page's own ground.
  const { ground } = useGround();
  return (
    <View style={[styles.card, { backgroundColor: ground }]}>
      <GroundProvider ground="page">
        {picker === null ? (
          <>
            <View style={styles.head}>
              {view.overline === undefined ? null : (
                <Text variant="overline" color="secondary">
                  {view.overline}
                </Text>
              )}
              <Text variant="body" bold>
                {view.title}
              </Text>
            </View>
            <PaymentTermsEditor {...view.body} previewHeight={TERMS_PREVIEW.cardHeight} />
            <View style={styles.rule} />
            <PaymentTermsFoot {...view.foot} />
          </>
        ) : (
          <>
            <View style={styles.back}>
              <IconButton
                label={words.backTo(view.title)}
                size={40}
                variant="surface"
                onClick={onDonePicking}
              >
                <ShellGlyph name="chevron-left" size="md" tone="primary" />
              </IconButton>
              <View style={styles.head}>
                <Text variant="overline" color="secondary">
                  {picker.overline}
                </Text>
                <Text variant="body" bold>
                  {words.pickerTitle}
                </Text>
              </View>
            </View>
            <PaymentTermsPicker {...picker.body} />
            <View style={styles.rule} />
            <PaymentTermsPickerFoot words={words} onDone={onDonePicking} />
          </>
        )}
      </GroundProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing['sp-4'],
    padding: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-tile'],
    ...theme.elevation.e2,
  },
  head: { gap: theme.spacing['sp-0-5'], flex: 1, minWidth: 0 },
  back: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  /** The rule between the body and the foot runs to the card's edges. */
  rule: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -theme.spacing['sp-5'],
    backgroundColor: theme.colors['line-soft'],
  },
});
