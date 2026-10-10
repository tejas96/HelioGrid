import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { SignupFactsProps } from './SignupCompanyStep.types';

/** A value is the system's `h4`: the scale has no bold body role, and the export's is not one. */
export function SignupFacts({ facts }: SignupFactsProps) {
  return (
    <View style={styles.facts}>
      {facts.map(({ label, value }) => (
        <View key={label} style={styles.fact}>
          <Text variant="caption" color="secondary">
            {label}
          </Text>
          <Text variant="h4">{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  /** On the page with no surface (`F7-49`). */
  facts: { marginTop: theme.spacing['sp-6'], gap: theme.spacing['sp-4'] },
  fact: { gap: theme.spacing['sp-1'] },
});
