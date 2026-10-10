import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Button } from '../Button/Button.native';
import { Sheet } from '../Sheet/Sheet.native';
import type { DoorSwitchProps } from './DoorSwitch.types';

/** The switch decision as a sheet over the number step: it has no handle and no way out but its two roads. */
export function DoorSwitch({ words, onConfirm }: DoorSwitchProps) {
  return (
    <Sheet
      open
      onClose={() => undefined}
      closeLabel={words.close}
      dismissible={false}
      handle={false}
      size="auto"
      density="expressive"
      title={words.title}
      subtitle={words.subtitle}
    >
      <View style={styles.body}>
        <View style={styles.actions}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled
            disabledReason={words.uploadReason}
          >
            {words.upload}
          </Button>
          <Button variant="destructive" size="lg" fullWidth onClick={onConfirm}>
            {words.confirm}
          </Button>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'], paddingBottom: theme.spacing['sp-2'] },
  actions: { gap: theme.spacing['sp-3'] },
});
