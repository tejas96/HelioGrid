import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { BillingValueText } from '../BillingStrip/BillingValue.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { SheetActions } from '../Sheet/SheetActions.native';
import type { BillingRefundAskProps } from './BillingHome.parts.types';
import { plain } from './BillingHome.values';

/**
 * The refund's one ask on the phone (D9, `F8-34`): composed as the cancel sheet is — what goes
 * back, that the plan ends today and that the data is kept, shown before the `destructive` act.
 */
export function BillingRefundAsk(props: BillingRefundAskProps) {
  const { words, pending } = props;
  return (
    <EditorSurface
      open={props.open}
      onClose={props.onClose}
      closeLabel={words.close}
      showClose
      dismissible={!pending}
      desktop="modal"
      size="auto"
      density="expressive"
      title={words.title}
      subtitle={words.subtitle}
      footer={
        <View style={styles.foot}>
          {props.failure === null ? null : (
            <Text variant="body-sm" color="danger" live>
              {props.failure}
            </Text>
          )}
          <SheetActions>
            <Button variant="ghost" size="md" disabled={pending} onClick={props.onClose}>
              {words.keep}
            </Button>
            <Button variant="destructive" size="md" loading={pending} onClick={props.onConfirm}>
              {words.act}
            </Button>
          </SheetActions>
        </View>
      }
    >
      <FactRows label={words.title} density="expressive" form="pair">
        <FactRow label={words.refund} value={<BillingValueText value={props.amount} />} />
        <FactRow label={words.ends} value={<BillingValueText value={plain(words.today)} />} />
        <FactRow label={words.yourData} value={<BillingValueText value={plain(words.kept)} />} />
      </FactRows>
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  foot: { gap: theme.spacing['sp-2'] },
});
