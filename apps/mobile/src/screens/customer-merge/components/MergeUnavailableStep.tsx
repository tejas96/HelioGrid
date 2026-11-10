import type { MergeUnavailable } from '@heliogrid/domain';
import { customerMergeUnavailableWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, Card, ListRow, ScopeNote, ShellGlyph, StatusChip } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

/**
 * Why the two cannot merge here, with no merge act anywhere (`M02-63`): a record outside the list
 * shows who holds it and never its name; then the way back.
 */
export function MergeUnavailableStep({
  unavailable,
  onBack,
}: {
  unavailable: MergeUnavailable;
  onBack: () => void;
}) {
  const t = useTranslate();
  const words = customerMergeUnavailableWords(t, unavailable);
  return (
    <View style={styles.stack}>
      {words.locked === null ? null : (
        <Card>
          <ListRow
            icon={<ShellGlyph name="lock" size="md" />}
            title={words.locked.title}
            subtitle={words.locked.holder}
          />
        </Card>
      )}
      <View style={styles.start}>
        <StatusChip tone="neutral" label={words.badge} />
      </View>
      <ScopeNote variant="panel" title={words.title} message={words.line} />
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        icon={<ShellGlyph name="chevron-left" size="md" />}
        onClick={onBack}
      >
        {words.back}
      </Button>
    </View>
  );
}
