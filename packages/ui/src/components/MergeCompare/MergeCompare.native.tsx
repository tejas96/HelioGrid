import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Card } from '../Card/Card.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { MERGE_FIELD_GLYPH } from './MergeCompare.logic';
import type {
  MergeCompareField,
  MergeCompareProps,
  MergeCompareRecord,
  MergeCompareValue,
  MergeCompareWords,
} from './MergeCompare.types';

/**
 * The compare on the phone: which record stays, as two rows in one card, then a pick for each
 * field the two disagree on in the second card — every choice a full-width row in thumb reach.
 */
export function MergeCompare({
  records,
  fields,
  same,
  onStay,
  onPick,
  disabled,
  words,
}: MergeCompareProps) {
  return (
    <View style={styles.compare}>
      <View style={styles.head}>
        <Text variant="overline" color="secondary">
          {words.whichStays}
        </Text>
      </View>
      <Card style={styles.card}>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={words.whichStays}
          style={styles.pair}
        >
          {records.map((record) => (
            <RecordChoice
              key={record.customerId}
              record={record}
              onStay={onStay}
              disabled={disabled}
              words={words}
            />
          ))}
        </View>
      </Card>
      {fields.length === 0 ? null : (
        <View style={styles.head}>
          <Text variant="overline" color="secondary">
            {words.pickEach}
          </Text>
          <Text variant="body-sm" color="secondary">
            {words.pickedCount}
          </Text>
        </View>
      )}
      <Card style={styles.card}>
        {fields.map((field) => (
          <FieldPick
            key={field.key}
            field={field}
            onPick={onPick}
            disabled={disabled}
            words={words}
          />
        ))}
        {same === null ? null : (
          <View style={[styles.line, fields.length === 0 ? null : styles.sameRule]}>
            <ShellGlyph name="tick" size="sm" tone="success" />
            <View style={styles.lineWords}>
              <Text variant="body-sm" color="secondary">
                {same}
              </Text>
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}

function RecordChoice({
  record,
  onStay,
  disabled,
  words,
}: {
  record: MergeCompareRecord;
  onStay: MergeCompareProps['onStay'];
  disabled: boolean;
  words: MergeCompareWords;
}) {
  const { controlFill } = useGround();
  return (
    <Pressable
      onPress={() => onStay(record.customerId)}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: record.stays, disabled }}
      style={[styles.choice, { backgroundColor: controlFill }, record.stays ? styles.on : null]}
    >
      <Avatar name={record.name ?? record.phone} size={40} />
      <View style={styles.words}>
        {record.name === null ? (
          <NamedGap gap={words.noName} scale="cell" />
        ) : (
          <Text variant="body" bold>
            {record.name}
          </Text>
        )}
        <View style={styles.recordLine}>
          <Text variant="mono" color="secondary">
            {record.phone}
          </Text>
          {record.city === null ? (
            <NamedGap gap={words.noCity} scale="cell" />
          ) : (
            <Text variant="body-sm" color="secondary">
              {record.city}
            </Text>
          )}
        </View>
        <StatusChip
          tone={record.stays ? 'success' : 'neutral'}
          label={record.stays ? words.stays : words.mergesIn}
        />
      </View>
      <ChoiceMark on={record.stays} />
    </Pressable>
  );
}

function FieldPick({
  field,
  onPick,
  disabled,
  words,
}: {
  field: MergeCompareField;
  onPick: MergeCompareProps['onPick'];
  disabled: boolean;
  words: MergeCompareWords;
}) {
  const { controlFill } = useGround();
  return (
    <View style={styles.field}>
      <View style={styles.label}>
        <View style={styles.labelWords}>
          <ShellGlyph name={MERGE_FIELD_GLYPH[field.key]} size="sm" tone="secondary" />
          <Text variant="body-sm" bold>
            {field.label}
          </Text>
        </View>
        {field.pickedId === null ? (
          <NamedGap gap={words.pickOne} scale="cell" />
        ) : (
          <View style={styles.labelWords}>
            <ShellGlyph name="tick" size="sm" tone="success" />
            <Text variant="body-sm" color="success">
              {words.picked}
            </Text>
          </View>
        )}
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel={field.label} style={styles.pair}>
        {field.options.map((option) => {
          const on = field.pickedId === option.customerId;
          return (
            <Pressable
              key={option.customerId}
              onPress={() => onPick(field.key, option.customerId)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled }}
              style={[styles.choice, { backgroundColor: controlFill }, on ? styles.on : null]}
            >
              <ChoiceMark on={on} />
              <View style={styles.words}>
                <Value value={option.value} />
                <Text variant="body-sm" color="secondary">
                  {option.from}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {field.note === null ? null : (
        <View style={styles.line}>
          <ShellGlyph name="tick" size="sm" tone="success" />
          <View style={styles.lineWords}>
            <Text variant="body-sm" color="secondary">
              {field.note}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function Value({ value }: { value: MergeCompareValue }) {
  if (value.kind === 'gap') return <NamedGap gap={value.words} scale="cell" />;
  return (
    <Text variant={value.mono ? 'mono' : 'body'} bold>
      {value.text}
    </Text>
  );
}

/** Which of a pair is chosen: the ring, filled with its tick once on. */
function ChoiceMark({ on }: { on: boolean }) {
  return (
    <ShellGlyph name={on ? 'circle-check' : 'ring'} size="md" tone={on ? 'accent' : 'secondary'} />
  );
}

const styles = StyleSheet.create({
  compare: { gap: theme.spacing['sp-3'] },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
  card: { gap: theme.spacing['sp-4'] },
  pair: { gap: theme.spacing['sp-2'] },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-tile'],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  /* RN has no inset ring: the chosen accent ring is a border the rest keep clear. */
  on: { borderColor: colors.accent },
  words: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: theme.spacing['sp-1'] },
  recordLine: { flexDirection: 'row', flexWrap: 'wrap', columnGap: theme.spacing['sp-2'] },
  field: { gap: theme.spacing['sp-2'] },
  label: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  labelWords: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  lineWords: { flex: 1, minWidth: 0 },
  sameRule: {
    paddingTop: theme.spacing['sp-3'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors['line-soft'],
  },
});
