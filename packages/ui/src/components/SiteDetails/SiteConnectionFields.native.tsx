import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Input } from '../Input/Input.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { Select } from '../Select/Select.native';
import {
  areaOptionsOf,
  operatorFieldOf,
  phaseOf,
  phaseOptionsOf,
  SITE_LOAD_MAX_LENGTH,
  type SiteConnectionFieldsProps,
} from './SiteDetails.logic';

/**
 * The connection, under its own overline: the state and its operator, then the supply phase and
 * the sanctioned load. None is asked for — each can be filled later.
 */
export function SiteConnectionFields({
  room,
  form,
  areas,
  operators,
  saving,
  acts,
  words,
}: SiteConnectionFieldsProps) {
  const operator = operatorFieldOf(form, areas, operators, words);
  const wide = room === 'wide';
  const cell = wide ? styles.cell : undefined;
  return (
    <View style={styles.rows}>
      <Text variant="overline" color="secondary">
        {words.connection}
      </Text>
      <View style={wide ? styles.pair : styles.stack}>
        <Select
          label={words.state}
          value={form.area?.area}
          placeholder={words.statePlaceholder}
          closeLabel={words.closeList}
          options={areaOptionsOf(areas)}
          disabled={saving}
          helper={form.areaFromPlace ? words.stateFromPlace : undefined}
          onChange={acts.onArea}
          style={cell}
        />
        <Select
          label={words.operator}
          value={form.utilityOperator ?? undefined}
          placeholder={operator.placeholder}
          closeLabel={words.closeList}
          options={[...operators]}
          disabled={saving || operator.disabled}
          helper={operator.helper}
          onChange={acts.onOperator}
          style={cell}
        />
      </View>
      <View style={wide ? styles.pair : styles.stack}>
        <SegmentedControl
          label={words.phase}
          fill
          value={form.supplyPhase}
          options={phaseOptionsOf(words)}
          onChange={(value) => {
            const phase = phaseOf(value);
            if (phase !== null && !saving) acts.onPhase(phase);
          }}
          style={cell}
        />
        <Input
          label={words.load}
          mono
          type="number"
          value={form.sanctionedLoad}
          maxLength={SITE_LOAD_MAX_LENGTH}
          trailing={
            <Text variant="body-sm" color="secondary">
              {words.loadUnit}
            </Text>
          }
          disabled={saving}
          helper={form.sanctionedLoad === '' ? words.loadLater : undefined}
          onChange={acts.onLoad}
          style={cell}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rows: { gap: theme.spacing['sp-5'] },
  stack: { gap: theme.spacing['sp-5'] },
  pair: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-4'] },
  /* Equal cells: a growing child sized to its content would crush its neighbour. */
  cell: { flex: 1, minWidth: 0 },
});
