import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { PhoneValue } from '../PhoneField/PhoneField.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import type { SignupAccountProps } from './SignupCompanyStep.types';

/** The verified number as a fact: a green-lit chip with the phone, the number in mono and its status. */
export function SignupAccount({ words, phoneE164 }: SignupAccountProps) {
  return (
    <View style={styles.account}>
      <View style={styles.glyph} accessibilityElementsHidden importantForAccessibility="no">
        <ShellGlyph name="phone" size="sm" tone="success" />
      </View>
      <View style={styles.number}>
        <PhoneValue label={words.label} value={phoneE164} />
      </View>
      <StatusChip status="verified" label={words.verified} tone="success" />
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * The verified number as a fact, not a field: a chip lit in the success tint, so it never reads
   * as the white fields under it.
   */
  account: {
    marginTop: theme.spacing['sp-5'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingLeft: theme.spacing['sp-3'],
    paddingRight: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-tile'],
    backgroundColor: colors['success-bg'],
  },
  glyph: {
    width: theme.spacing['sp-10'],
    height: theme.spacing['sp-10'],
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors['canvas-sunken'],
  },
  number: { flex: 1, minWidth: 0 },
});
