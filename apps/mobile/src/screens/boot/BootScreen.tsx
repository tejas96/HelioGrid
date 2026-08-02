import { theme } from '@heliogrid/tokens/theme';
import { StyleSheet, View } from 'react-native';
import { Wordmark } from '../../ui';

/**
 * Held while the session resolves. Matches the native launch screen's canvas exactly, so the
 * native → JS handoff has nothing to flash.
 *
 * The wordmark is the only branded element docs/10 sanctions — no logo exists and none is
 * invented here.
 */
export function BootScreen() {
  return (
    <View style={styles.screen}>
      <Wordmark />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
