import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import type { AccessRemovedProps } from './AccessRemoved.types';
import { useAccessRemoved } from './useAccessRemoved';

/** Frame 8 — what happened, the one way on, and the grievance contact, centred in the page. */
export function AccessRemoved({
  title,
  description,
  actionLabel,
  onAction,
  grievanceLabel,
  onGrievance,
}: AccessRemovedProps) {
  const { busy, act } = useAccessRemoved(onAction);
  return (
    <View style={styles.page}>
      <EmptyState
        icon={<ShellGlyph name="lock" size="xl" tone="primary" />}
        title={title}
        description={description}
        action={
          <View style={styles.actions}>
            <Button onClick={act} disabled={busy}>
              {actionLabel}
            </Button>
            <Button variant="ghost" onClick={onGrievance}>
              {grievanceLabel}
            </Button>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Grows to the region and centres in it — the region must grow to the page too (`D77`).
  page: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    paddingVertical: theme.spacing['sp-6'],
  },
  actions: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});
