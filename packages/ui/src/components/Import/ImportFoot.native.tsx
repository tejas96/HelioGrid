import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import type { ImportFootProps } from './Import.types';

/**
 * The step's one act, full width, with its line centred under it — the phone is always the narrow
 * form, so `wide` and the ways out beside the act are the web's. A gated act says why in its
 * bubble, never in a drawn line; a report with no act keeps only its line.
 */
export function ImportFoot({ act, quiet }: ImportFootProps) {
  const line = act === null ? quiet : act.line;
  if (act === null && line === null) return null;
  return (
    <View style={styles.foot}>
      {act === null ? null : (
        <Button
          variant={act.secondary ? 'secondary' : 'primary'}
          size="lg"
          fullWidth
          disabled={act.gate !== null}
          disabledReason={act.gate ?? undefined}
          onClick={act.onPress}
        >
          {act.label}
        </Button>
      )}
      {line === null ? null : (
        <Text variant="caption" color="secondary" align="center">
          {line}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  foot: { gap: theme.spacing['sp-2'] },
});
