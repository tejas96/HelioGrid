import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ResolvedStep } from './resolve-steps';
import { stateWord } from './resolve-steps';
import { StepperMarker } from './StepperMarker.native';

interface StepperNumberedItemProps {
  active: boolean;
  index: number;
  last: boolean;
  markerSize: number;
  onPress?: () => void;
  step: ResolvedStep;
  tight: boolean;
  total: number;
}

/** One marker, its name, and the connector line that runs to the next step. */
export function StepperNumberedItem({
  active,
  index,
  last,
  markerSize,
  onPress,
  step,
  tight,
  total,
}: StepperNumberedItemProps) {
  const word = stateWord(step);
  return (
    <View style={[styles.item, last ? styles.itemLast : undefined]}>
      {/* 44dp target around the 28dp marker, the extra taken back as negative margin so the rail's
          geometry is unchanged. */}
      <Pressable
        accessibilityLabel={`Step ${index + 1} of ${total}, ${step.label}, ${word.toLowerCase()}`}
        disabled={onPress === undefined}
        onPress={onPress}
        style={styles.node}
      >
        <StepperMarker index={index} size={markerSize} step={step} />
      </Pressable>
      <View style={[styles.body, tight ? styles.bodyTight : undefined]}>
        <View style={styles.name}>
          <Text
            variant="body-sm"
            color={step.state === 'not-started' ? 'tertiary' : 'primary'}
            style={active ? styles.nameActive : styles.nameWords}
          >
            {step.label}
          </Text>
          {step.state === 'errors' ? (
            <Text variant="caption" color="danger">
              {word}
            </Text>
          ) : null}
          {step.optional === true && step.state !== 'errors' ? (
            <Text variant="caption" color="tertiary">
              Optional
            </Text>
          ) : null}
        </View>
        {last ? null : (
          <View style={[styles.line, step.state === 'done' ? styles.lineDone : undefined]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemLast: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  node: {
    flexShrink: 0,
    width: 44,
    height: 44,
    margin: -8,
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingTop: theme.spacing['sp-1'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
  },
  bodyTight: {
    paddingTop: theme.spacing['sp-0-5'],
  },
  name: {
    minWidth: 0,
    flexShrink: 1,
  },
  /* 14 is off the DS type ladder; body-sm (13) is the nearest role and carries the step name. */
  nameWords: {
    fontSize: 14,
  },
  nameActive: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: theme.type.roles.button.letterSpacing,
  },
  line: {
    flex: 1,
    minWidth: 16,
    height: 2,
    borderRadius: 2,
    marginRight: theme.spacing['sp-2'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  lineDone: {
    backgroundColor: theme.colors.success,
    opacity: 0.35,
  },
});
