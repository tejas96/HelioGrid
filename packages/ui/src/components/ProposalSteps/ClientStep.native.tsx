import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Input } from '../Input/Input.native';
import { Select } from '../Select/Select.native';
import { areaSelects } from './ProposalSteps.logic';
import type { ClientStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { FieldSaveLine, StepFacts, StepTile, stepLayout } from './StepParts.native';

/**
 * Step 10 (`M06-16`, `T-M06-012`): the customer comes from the lead, locked; the site's address is
 * the one field, and it is saved on the lead. The number is the server's, never typed.
 */
export function ClientStep({ view, shared }: { view: ClientStepView; shared: ProposalStepWords }) {
  const { words } = view;
  const selects = view.area === undefined ? null : areaSelects(view.area, words);
  return (
    <View style={stepLayout.column}>
      <StepTile style={styles.client}>
        <Avatar name={view.name} size={48} hue="teal" />
        <View style={styles.words}>
          <Text variant="h3">{view.name}</Text>
          {view.phone === undefined ? null : (
            <Text variant="mono" color="secondary">
              {view.phone}
            </Text>
          )}
        </View>
        <View style={styles.lock}>
          <ShellGlyph name="lock" size="sm" />
          <Text variant="caption" color="secondary">
            {words.fromLead}
          </Text>
        </View>
      </StepTile>
      <View style={stepLayout.field}>
        <Input
          label={words.address}
          value={view.address}
          commitOnBlur
          onCommit={view.onAddress}
          helper={words.addressHelper}
          {...(view.addressMissing ? { error: words.addressMissing } : {})}
        />
        <FieldSaveLine save={view.saves?.address} words={shared} />
      </View>
      {selects === null ? null : (
        <View style={stepLayout.field}>
          <Select {...selects[0]} />
          <Select {...selects[1]} />
          <FieldSaveLine save={view.saves?.area} words={shared} />
        </View>
      )}
      <StepFacts facts={view.facts} />
    </View>
  );
}

const styles = StyleSheet.create({
  client: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-4'],
  },
  words: { flex: 1, minWidth: 0 },
  lock: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
});
