import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import { barLineOf, type SiteFormBarProps } from './SiteDetails.logic';

/**
 * The bar at the foot of the form: why the design cannot start yet or what comes next, then the
 * way out — where the room is wide — and *Start design*. A save that came back undone is said
 * here, where the person pressed. It is the form's last row and scrolls with it: the page that
 * holds the form owns the scroller, and its end already stands clear of the home indicator.
 */
export function SiteFormBar({ room, form, saving, failure, acts, words }: SiteFormBarProps) {
  const wide = room === 'wide';
  return (
    <View style={styles.bar}>
      {failure === null ? null : <PendingAction state="returned" reason={failure} />}
      <View style={wide ? styles.row : styles.column}>
        <Text variant="body-sm" color="secondary" style={wide ? styles.line : undefined}>
          {barLineOf(form, words)}
        </Text>
        {wide ? (
          <Button variant="ghost" size="lg" disabled={saving} onClick={acts.onCancel}>
            {words.cancel}
          </Button>
        ) : null}
        <Button
          variant="primary"
          size="lg"
          fullWidth={!wide}
          disabled={form.pin === null}
          loading={saving}
          iconRight={<ShellGlyph name="arrow-right" size="md" tone="inverse" />}
          onClick={acts.onStart}
        >
          {words.start}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: theme.spacing['sp-2'],
    paddingTop: theme.spacing['sp-3'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors['line-soft'],
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  column: { gap: theme.spacing['sp-2'] },
  line: { flex: 1, minWidth: 0 },
});
