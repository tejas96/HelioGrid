import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { PhoneValue } from '../PhoneField/PhoneField.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import type { SignupAccountProps } from './SignupCompanyStep.types';

export function SignupAccount({ words, phoneE164 }: SignupAccountProps) {
  return (
    <View style={styles.account}>
      <PhoneValue label={words.label} value={phoneE164} />
      <StatusChip status="verified" label={words.verified} tone="success" />
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * The verified number as a fact on the page, the chip at the right — no surface (`F7-49`): a grey
   * tile would make it look like the fields below it, and a white card vanishes on the white page.
   */
  account: {
    marginTop: theme.spacing['sp-5'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
});
