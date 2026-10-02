import type { UpdateRequired as Refusal } from '@heliogrid/data';
import { SHELL, updateOnStoreLabel } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, EmptyState, ShellGlyph } from '@heliogrid/ui';
import { Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles';

/**
 * Frame 10 (`F4-36`): the api turned this build away, so this replaces every surface, the door
 * included. No top bar and no company: the refused call is the one that would have said whose
 * HelioGrid this is. A store link that fails to open leaves the screen as it is, to tap again.
 */
export function UpdateRequired({ refusal }: { refusal: Refusal }) {
  const t = useTranslate();
  const openStore = () => void Linking.openURL(refusal.storeUrl).catch(() => undefined);
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.updateScroll}>
        <EmptyState
          icon={<ShellGlyph name="download" size="xl" tone="primary" />}
          title={t(SHELL.updateRequired)}
          description={t(SHELL.updateVersions, {
            current: refusal.currentVersion,
            required: refusal.requiredVersion,
          })}
          action={
            <Button onClick={openStore}>{updateOnStoreLabel(t, refusal.storePlatform)}</Button>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}
