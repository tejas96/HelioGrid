import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { BuilderSave, ProposalBuilderWords } from './ProposalBuilder.types';

/**
 * The draft's save state beside the title (`T-M06-023`): a quiet *Saved* tick, or what stopped the
 * last commit — said once here, while the field that failed keeps its own line.
 */
export function BuilderSaveMark({
  save,
  words,
}: {
  save: BuilderSave | null;
  words: ProposalBuilderWords;
}) {
  if (save === null) return null;
  if (save.kind === 'saved' || save.kind === 'saving') {
    return (
      <View style={styles.mark} accessibilityLiveRegion="polite">
        {save.kind === 'saved' ? <ShellGlyph name="check" size="sm" tone="success" /> : null}
        <Text variant="caption" color="success">
          {save.kind === 'saved' ? words.saved : words.saving}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.mark} accessibilityLiveRegion="polite">
      <ShellGlyph
        name={save.kind === 'offline' ? 'cloud-off' : 'alert-circle'}
        size="sm"
        tone="warning"
      />
      <Text variant="caption" color="warning">
        {save.kind === 'offline'
          ? words.offline
          : save.kind === 'conflict'
            ? words.conflict
            : words.unsaved(save.count)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 1 },
});
