import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import type { actOf } from './CatalogImport.steps';
import type { CatalogImportProps } from './CatalogImport.types';

type ImportAct = ReturnType<typeof actOf>;

interface ImportFootProps {
  props: CatalogImportProps;
  act: ImportAct;
}

/**
 * The step's one act, full width, with its line centred under it. A gated act says why in its
 * bubble, never in a drawn line; a report with no act keeps only its line.
 */
export function ImportFoot({ props, act }: ImportFootProps) {
  const line = act === null ? quietLine(props) : act.line;
  if (act === null && line === null) return null;
  return (
    <View style={styles.foot}>
      {act === null ? null : (
        <Button
          variant={act.secondary ? 'secondary' : 'primary'}
          size="lg"
          fullWidth
          disabled={act.gate !== null}
          disabledReason={act.gate ?? undefined}
          onClick={act.onPress}
        >
          {act.label}
        </Button>
      )}
      {line === null ? null : (
        <Text variant="caption" color="secondary" align="center">
          {line}
        </Text>
      )}
    </View>
  );
}

/** The line of a report with no act: the kept report still opening, or kept. */
function quietLine(props: CatalogImportProps): TranslatedText | null {
  if (props.opening) return props.words.opening;
  return props.frame === 'report' ? props.words.kept : null;
}

const styles = StyleSheet.create({
  foot: { gap: theme.spacing['sp-2'] },
});
