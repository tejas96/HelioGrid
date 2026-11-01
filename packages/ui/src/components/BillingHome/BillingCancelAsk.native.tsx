import { CANCELLATION_REASONS } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { Radio } from '../Radio/Radio.native';
import { SheetActions } from '../Sheet/SheetActions.native';
import type { BillingCancelAskProps } from './BillingHome.parts.types';
import { plain } from './BillingHome.values';
import { BillingValueText } from './BillingValue.native';

/**
 * The cancel ask on the phone (`M12-50`, frame 14): a sheet with what runs on and what is kept,
 * then the reasons — never a gate: `Skip` cancels with none. While the send is out every control
 * waits; a refusal is said here, above the acts.
 */
export function BillingCancelAsk(props: BillingCancelAskProps) {
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
            <Button variant="ghost" size="md" disabled={pending} onClick={props.onSkip}>
              {words.skip}
            </Button>
            <Button variant="destructive" size="md" loading={pending} onClick={props.onConfirm}>
              {words.act}
            </Button>
          </SheetActions>
        </View>
      }
    >
      <View style={styles.body}>
        <FactRows label={words.title} density="expressive" form="pair">
          <FactRow
            label={words.runsUntil}
            value={<BillingValueText value={plain(props.runsUntil)} />}
          />
          <FactRow label={words.yourData} value={<BillingValueText value={plain(words.kept)} />} />
        </FactRows>
        {/* The group's name is the subtitle above; each option is a radio (`Radio`'s own role). */}
        <View
          style={styles.reasons}
          accessibilityRole="radiogroup"
          accessibilityLabel={words.whyLeaving}
        >
          {CANCELLATION_REASONS.map((reason) => (
            <Radio
              key={reason}
              name="reason"
              value={reason}
              label={words.reason(reason)}
              checked={props.chosen === reason}
              disabled={pending}
              onChange={() => props.onChoose(reason)}
            />
          ))}
        </View>
      </View>
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  reasons: { gap: theme.spacing['sp-2'] },
  foot: { gap: theme.spacing['sp-2'] },
});
