import type { ImportWizardFrame } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { IconButton } from '../IconButton/IconButton.native';
import { Stepper } from '../Stepper/Stepper.native';
import type { CatalogImportWords } from './CatalogImport.types';
import { ImportGlyph } from './ImportGlyph.native';

/** The frames whose head offers *Back*: steps 2 and 3, and the matching wait between them. */
const BACK_FRAMES: readonly ImportWizardFrame[] = ['columns', 'matching', 'preview'];

interface ImportHeadProps {
  words: CatalogImportWords;
  frame: ImportWizardFrame;
  step: number;
  onClose: () => void;
  onBack: () => void;
  onSteps: () => void;
}

/**
 * The sheet's head: the round close, the title with the location line under it — which opens the
 * step list — *Back* from step 2, and the thin four-part step bar. The title and its location line
 * press together: the line alone is a caption, under the 44dp floor `Pressable` holds.
 */
export function ImportHead({ words, frame, step, onClose, onBack, onSteps }: ImportHeadProps) {
  return (
    <View style={styles.head}>
      <View style={styles.row}>
        <IconButton label={words.close} size={40} variant="surface" onClick={onClose}>
          <ImportGlyph name="close" size="sm" stroke={2} color={theme.colors['text-primary']} />
        </IconButton>
        <Pressable
          accessibilityLabel={words.locationLabel(step)}
          onPress={onSteps}
          style={styles.words}
        >
          <Text variant="body" bold>
            {words.title}
          </Text>
          <View style={styles.location}>
            <Text variant="caption" color="secondary">
              {words.location(step)}
            </Text>
            <ImportGlyph
              name="chevron"
              size="xs"
              stroke={2}
              color={theme.colors['text-secondary']}
            />
          </View>
        </Pressable>
        {BACK_FRAMES.includes(frame) ? (
          <View style={styles.back}>
            <Button variant="ghost" size="sm" onClick={onBack}>
              {words.back}
            </Button>
          </View>
        ) : null}
      </View>
      <Stepper
        variant="bars"
        steps={[...words.steps]}
        current={step}
        label={words.stepsLabel}
        words={words.stepper}
      />
    </View>
  );
}

/* The board's head: 12 above (the sheet's body gives 10 of it), 10 under, 10 between the row and
   the bar, 12 across the row. The sheet's body supplies the 16 at each side. */
const styles = StyleSheet.create({
  head: {
    gap: 10,
    paddingTop: theme.spacing['sp-0-5'],
    paddingBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'], minWidth: 0 },
  words: { flex: 1, minWidth: 0, alignItems: 'flex-start', justifyContent: 'center' },
  location: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-0-5'] },
  back: { flexShrink: 0 },
});
