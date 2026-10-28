import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { AllocationMeter } from '../AllocationMeter/AllocationMeter.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { SheetActions } from '../Sheet/SheetActions.native';
import type { PaymentTermsFootProps } from './PaymentTermsSettings.types';

/**
 * The editor sheet's foot on the phone (`SCR-M01-20` m20-c2): the save-failed banner over the
 * meter, then the acts. While the split is not whole *Save terms* stays focusable and says why;
 * whole, *Cancel* and *Save terms* sit side by side.
 */
export function PaymentTermsFoot(props: PaymentTermsFootProps) {
  const { words } = props;
  return (
    <View style={styles.foot}>
      {props.saveFailed ? (
        <Banner kind="validation" density="functional" title={words.saveFailedTitle}>
          {props.saveFailedBody ?? words.saveFailedBody}
        </Banner>
      ) : null}
      <AllocationMeter
        label={words.allocation}
        parts={props.parts.map((part) => ({ label: part.label, value: part.value }))}
        tolerance={0}
        enforcement="immediate"
        enforcementNote=""
        state={props.state}
        remainderWords={props.sentence}
        density="functional"
      />
      {props.refusal === undefined ? (
        <SheetActions>
          <Button variant="ghost" size="md" onClick={props.onCancel}>
            {words.cancel}
          </Button>
          <Button variant="primary" size="md" loading={props.saving} onClick={props.onSave}>
            {words.save}
          </Button>
        </SheetActions>
      ) : (
        <View style={styles.refused}>
          <Button variant="primary" size="md" fullWidth disabled disabledReason={props.refusal}>
            {words.save}
          </Button>
          <Button variant="ghost" size="md" fullWidth onClick={props.onCancel}>
            {words.cancel}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  foot: { gap: theme.spacing['sp-2'] },
  refused: { gap: theme.spacing['sp-2'] },
});
