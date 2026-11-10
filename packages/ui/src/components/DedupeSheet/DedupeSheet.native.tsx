import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Sheet } from '../Sheet/Sheet.native';
import { DedupeChoice } from './DedupeChoice.native';
import { DedupeKeepBoth } from './DedupeKeepBoth.native';
import { DedupeRecord } from './DedupeRecord.native';
import { choicesOf, isActWaiting } from './DedupeSheet.logic';
import type { DedupeSheetProps } from './DedupeSheet.types';
import { useKeepBoth } from './use-keep-both';

/**
 * The duplicate sheet (`M02-08`, `M02-09`, `M02-66`): the record the number already belongs to,
 * its three facts, and exactly three choices — the third opening a reason box. Dismissing it
 * creates nothing; while an act waits every choice, the drag, the backdrop and Back wait with it.
 */
export function DedupeSheet(props: DedupeSheetProps) {
  const { open, onClose, record, ownerName, stage, canKeepBoth, act, onKeepBoth, words } = props;
  const keepBoth = useKeepBoth(open);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      title={words.heading}
      subtitle={words.intro}
      dismissible={!isActWaiting(act)}
    >
      <View style={styles.sheet}>
        <DedupeRecord record={record} ownerName={ownerName} stage={stage} words={words} />
        <View style={styles.choices}>
          {choicesOf(props, keepBoth).map((one) => (
            <DedupeChoice key={one.choice} {...one} record={record} act={act} words={words} />
          ))}
          {canKeepBoth && keepBoth.shown ? (
            <DedupeKeepBoth
              reason={keepBoth.reason}
              onReason={keepBoth.setReason}
              onConfirm={onKeepBoth}
              act={act}
              words={words}
            />
          ) : null}
        </View>
        <Text variant="body-sm" color="secondary">
          {words.nothingCreated}
        </Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: theme.spacing['sp-4'] },
  choices: { gap: theme.spacing['sp-2'] },
});
