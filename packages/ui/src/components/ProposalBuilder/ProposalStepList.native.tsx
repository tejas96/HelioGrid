import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Rising } from '../../primitives/rising.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { HueTile } from '../HueTile/HueTile.native';
import { Sheet } from '../Sheet/Sheet.native';
import { Switch } from '../Switch/Switch.native';
import type { BuilderStep, ProposalStepListProps } from './ProposalBuilder.types';

function StepRow({
  step,
  now,
  props,
}: {
  step: BuilderStep;
  now: boolean;
  props: ProposalStepListProps;
}) {
  const { words } = props;
  /* A step Quick mode hides stands on its default, whatever its own standing says. */
  const standing = step.quiet === true && step.standing !== 'to_do' ? 'default' : step.standing;
  const tone = standing === 'to_do' ? 'warning' : standing === 'done' ? 'success' : 'secondary';
  return (
    <Pressable
      style={[styles.row, now ? styles.rowNow : undefined]}
      accessibilityState={{ current: now }}
      onPress={() => props.onStep(step.key)}
    >
      <HueTile
        glyph={step.glyph}
        hue={step.standing === 'to_do' ? 'warning' : 'ocean'}
        size={36}
        stroke={1.7}
      />
      <View style={styles.words}>
        <Text variant="body" bold color={step.quiet === true ? 'secondary' : 'primary'}>
          {step.heading}
        </Text>
        {step.summary === undefined ? null : (
          <Text variant="body-sm" color="secondary">
            {step.summary}
          </Text>
        )}
      </View>
      <View style={styles.stand}>
        <ShellGlyph
          name={standing === 'to_do' ? 'alert-circle' : 'tick-small'}
          size="sm"
          tone={tone}
        />
        <Text variant="caption" color={tone} bold>
          {words.standing[standing]}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Every step in one list (`M06-24`): the capsule opens it, and so does a long title the capsule had
 * to cut. A step Quick mode hides is offered quietly; opening it is the expansion.
 */
export function ProposalStepList(props: ProposalStepListProps) {
  const { words, quick } = props;
  return (
    <Sheet
      open={props.open}
      onClose={props.onClose}
      closeLabel={words.closeLabel}
      showClose
      title={words.title}
      footer={
        <View style={styles.foot}>
          <Button variant="primary" size="lg" fullWidth onClick={props.onGenerate}>
            {words.generate}
          </Button>
          <Text variant="caption" color="secondary" align="center">
            {words.note}
          </Text>
        </View>
      }
    >
      <View style={styles.list}>
        {quick === undefined ? null : (
          <View style={styles.quick}>
            <Switch
              checked={quick.on}
              onChange={quick.onChange}
              label={words.quickLabel}
              description={words.quickLine}
            />
          </View>
        )}
        <View>
          {props.steps.map((step, index) => (
            <Rising key={step.key} order={index}>
              <StepRow step={step} now={step.key === props.current} props={props} />
            </Rising>
          ))}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.spacing['sp-4'] },
  quick: {
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-lg'],
    backgroundColor: colors.fill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: 10,
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-md'],
  },
  rowNow: { backgroundColor: colors['accent-subtle'] },
  words: { flex: 1, minWidth: 0 },
  stand: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  foot: { gap: theme.spacing['sp-2'] },
});
