import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import type { ProjectSheetSendProps } from './ProjectActSheet.types';

/** A sheet's send at its foot on the phone: the refusal above it, its glyph, busy while out. */
export function ProjectSheetSend({
  label,
  ready,
  pending,
  failure,
  onSend,
  glyph,
  destructive,
}: ProjectSheetSendProps) {
  return (
    <View style={styles.send}>
      {failure === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {failure}
        </Text>
      )}
      <Button
        variant={destructive ? 'destructive' : 'primary'}
        size="lg"
        fullWidth
        disabled={!ready}
        loading={pending}
        icon={glyph === null ? null : <ShellGlyph name={glyph} size="md" tone="inverse" />}
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
  send: { gap: theme.spacing['sp-2'], paddingTop: theme.spacing['sp-1'] },
});
