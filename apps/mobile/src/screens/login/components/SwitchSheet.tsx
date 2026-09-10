import type { PendingSwitch } from '@heliogrid/data';
import { SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, Sheet, Text, useFormat } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

/**
 * The one deliberately unrecoverable act in the product (`F4-37`, the carve-out from `F4-21`):
 * what will be lost is named BEFORE the switch, upload is offered first, the sheet cannot be
 * dismissed into silence, and the words say it cannot be undone.
 */
export function SwitchSheet({
  pending,
  onConfirm,
}: {
  pending: PendingSwitch;
  onConfirm: () => void;
}) {
  const t = useTranslate();
  const { date } = useFormat();
  const { heldWork, next } = pending;
  return (
    <Sheet
      open
      onClose={() => undefined}
      dismissible={false}
      handle={false}
      size="auto"
      density="expressive"
      title={t(SIGN_IN.switchTitle, { name: next.name, count: heldWork.count })}
      subtitle={t(SIGN_IN.switchSubtitle, { date: date(heldWork.capturedAt) })}
    >
      <View style={styles.sheetBody}>
        <View style={[styles.tinted, styles.tintedDanger]}>
          <Text variant="body-sm" color="danger">
            {t(SIGN_IN.switchBlockTitle)}
          </Text>
          <Text variant="caption" color="secondary">
            {t(SIGN_IN.switchBlockBody)}
          </Text>
        </View>
        <View style={styles.sheetActions}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled
            disabledReason={t(SIGN_IN.uploadArrivesLater)}
          >
            {t(SIGN_IN.uploadFirst)}
          </Button>
          <Button variant="destructive" size="lg" fullWidth onClick={onConfirm}>
            {t(SIGN_IN.signInAndDiscard)}
          </Button>
        </View>
      </View>
    </Sheet>
  );
}
