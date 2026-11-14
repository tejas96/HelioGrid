import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Sheet } from '../Sheet/Sheet.native';
import type { ProposalPreviewSheetProps } from './ProposalBuilder.types';

/** The page the customer gets, over the step that feeds it (`T-M06-015`): one renderer, so it cannot differ. */
export function ProposalPreviewSheet(props: ProposalPreviewSheetProps) {
  return (
    <Sheet
      open={props.open}
      onClose={props.onClose}
      closeLabel={props.closeLabel}
      showClose
      title={props.title}
    >
      <View style={styles.preview}>
        {props.page}
        <Text variant="caption" color="secondary" align="center">
          {props.pageLine}
        </Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center', gap: theme.spacing['sp-3'] },
});
