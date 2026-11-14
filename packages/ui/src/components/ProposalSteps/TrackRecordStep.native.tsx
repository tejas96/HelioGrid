import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { NumberField } from '../NumberField/NumberField.native';
import { Textarea } from '../Textarea/Textarea.native';
import type { TrackRecordStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { FieldSaveLine, StepHint, StepTile, stepLayout } from './StepParts.native';
import { trackRecordCells } from './step-fields';
import { useAboutDraft } from './use-about-draft';

function About({ view, shared }: { view: TrackRecordStepView; shared: ProposalStepWords }) {
  const { about, words } = view;
  const { text, change, leave } = useAboutDraft(view);
  if (about === undefined) return null;
  return (
    <View style={stepLayout.field}>
      <View style={stepLayout.top}>
        <Text variant="field-label" color="secondary">
          {words.about}
        </Text>
        <Text variant="caption" color="secondary">
          {words.aboutCount(text.length, about.max)}
        </Text>
      </View>
      <Textarea
        label={words.about}
        labelSpokenOnly
        value={text}
        onChange={change}
        onLeave={leave}
        maxLength={about.max}
        rows={4}
      />
      <FieldSaveLine save={view.saves?.about} words={shared} />
    </View>
  );
}

/**
 * Step 2 (`M06-08`, `T-M06-004`): the three figures the customer reads are the fields. Numbers
 * only; each figure's unit is the word under it.
 */
export function TrackRecordStep({
  view,
  shared,
}: {
  view: TrackRecordStepView;
  shared: ProposalStepWords;
}) {
  const { words } = view;
  return (
    <View style={stepLayout.column}>
      <StepTile style={styles.counts}>
        {trackRecordCells(view, shared).map((cell, index) => (
          <View
            style={index === 0 ? styles.count : [styles.count, styles.divided]}
            key={cell.count}
          >
            <NumberField {...cell.field} />
            <Text variant="body-sm" color="secondary">
              {cell.unit}
            </Text>
            <FieldSaveLine save={cell.save} words={shared} />
          </View>
        ))}
      </StepTile>
      <About view={view} shared={shared} />
      <StepHint>{words.hint}</StepHint>
    </View>
  );
}

const styles = StyleSheet.create({
  counts: { flexDirection: 'row', overflow: 'hidden' },
  count: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingVertical: theme.spacing['sp-5'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  divided: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors['line-soft'] },
});
