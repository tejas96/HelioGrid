import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import type { ButtonVariant } from '../Button/Button.types';
import type { LeadActSheetProps } from './LeadActSheet.types';

/** What every form draws beside its own fields. */
export interface LeadFormFrame {
  readonly pending: boolean;
  readonly failure: TranslatedText | null;
  readonly fields: LeadActSheetProps['fields'];
}

interface LeadActSendProps {
  readonly label: TranslatedText;
  /** The send sleeps until the form holds what the act requires. */
  readonly ready: boolean;
  readonly pending: boolean;
  readonly failure: TranslatedText | null;
  readonly onSend: () => void;
  readonly variant?: ButtonVariant;
}

/**
 * A sheet's foot: why the last send came back undone, said above it, and the send — asleep until
 * the form is complete, loading while it is out, and a second press sending nothing.
 */
export function LeadActSend({
  label,
  ready,
  pending,
  failure,
  onSend,
  variant = 'primary',
}: LeadActSendProps) {
  return (
    <View style={styles.foot}>
      {failure === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {failure}
        </Text>
      )}
      <Button
        variant={variant}
        size="lg"
        fullWidth
        disabled={!ready}
        loading={pending}
        onClick={() => {
          if (ready && !pending) onSend();
        }}
      >
        {label}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  foot: { gap: theme.spacing['sp-2'], paddingTop: theme.spacing['sp-2'] },
});
