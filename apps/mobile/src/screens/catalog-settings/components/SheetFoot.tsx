import type { TranslatedText } from '@heliogrid/contracts';
import { Button, Text } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

/**
 * A catalog sheet's pinned foot (`SCR-M01-15` sheetFoot): an optional consequence line centred
 * above *Cancel* and the act, the act the wider.
 */
export function SheetFoot({
  line = null,
  cancel,
  onCancel,
  act,
  onAct,
  busy = false,
  off = false,
  destructive = false,
}: {
  line?: TranslatedText | null;
  cancel: TranslatedText;
  onCancel: () => void;
  act: TranslatedText;
  onAct: () => void;
  busy?: boolean;
  off?: boolean;
  destructive?: boolean;
}) {
  return (
    <View style={styles.foot}>
      {line === null ? null : (
        <Text variant="caption" color="secondary" align="center">
          {line}
        </Text>
      )}
      <View style={styles.footActs}>
        <View style={styles.footCancel}>
          <Button variant="secondary" size="lg" fullWidth onClick={onCancel}>
            {cancel}
          </Button>
        </View>
        <View style={styles.footAct}>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            size="lg"
            fullWidth
            loading={busy}
            disabled={off}
            onClick={onAct}
          >
            {act}
          </Button>
        </View>
      </View>
    </View>
  );
}
