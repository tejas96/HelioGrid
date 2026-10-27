import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Badge } from '../Chip/Chip.native';
import { Timeline } from '../Timeline/Timeline.native';
import type { PaymentTermsPickerProps } from './PaymentTermsSettings.types';

/**
 * The stage picker's body on the phone (`SCR-M01-20` m20-d), in the chained sheet: the project's
 * journey on one rail, each stage with its glyph, label and short *when*, and the tranches due
 * there as pills. The phone's node cannot recolour a caller's glyph, so the chosen stage's glyph
 * is passed in the inverse tone here.
 */
export function PaymentTermsPicker({
  words,
  label,
  stages,
  value,
  onChange,
}: PaymentTermsPickerProps) {
  return (
    <Timeline
      label={label}
      value={value}
      onChange={onChange}
      density="functional"
      items={stages.map((stage) => ({
        id: stage.id,
        label: stage.label,
        description: stage.short,
        icon: (
          <ShellGlyph
            name={stage.glyph}
            size="sm"
            tone={stage.id === value ? 'inverse' : 'secondary'}
          />
        ),
        ...(stage.skippable
          ? {
              tone: 'warning' as const,
              marks: (
                <Badge tone="warning" density="functional">
                  {words.canBeSkipped}
                </Badge>
              ),
            }
          : {}),
        ...(stage.pills.length === 0
          ? {}
          : {
              content: (
                <View style={styles.pills}>
                  {stage.pills.map((pill) => (
                    <Badge
                      key={pill.key}
                      tone={pill.mine ? 'accent' : 'neutral'}
                      density="functional"
                    >
                      {pill.text}
                    </Badge>
                  ))}
                </View>
              ),
            }),
      }))}
    />
  );
}

/** The picker's foot: the skip rule in words, said once, beside *Done*. */
export function PaymentTermsPickerFoot({
  words,
  onDone,
}: Pick<PaymentTermsPickerProps, 'words'> & { onDone(): void }) {
  return (
    <View style={styles.foot}>
      <View style={styles.grow}>
        <Text variant="caption" color="secondary">
          {words.skipRule}
        </Text>
      </View>
      <Button variant="primary" size="md" onClick={onDone}>
        {words.done}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-1'] },
  /** The skip rule takes the row's room and wraps, so a long Hindi line never pushes *Done* off. */
  foot: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  grow: { flex: 1, minWidth: 0 },
});
