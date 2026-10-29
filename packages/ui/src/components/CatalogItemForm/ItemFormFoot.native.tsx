import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import type { CatalogItemFormProps } from './CatalogItemForm.types';

/**
 * The sheet's foot (`SCR-M01-16`, the 375 frames): the line read before acting, centred — or, when
 * the create came back unsent, the returned line with *Try again* and *Dismiss* in its place — then
 * *Cancel* and the primary side by side, the primary busy while the create is out.
 */
export function ItemFormFoot({ props }: { props: CatalogItemFormProps }) {
  const { words } = props;
  /* *Try again* and *Dismiss* leave with the returned line they sit in: the screen reader lands on
     the primary, never at the sheet's start. */
  const primary = useRef<View>(null);
  return (
    <View style={styles.foot}>
      {props.returned ? (
        <PendingAction
          state="returned"
          label={words.primary}
          reason={words.returned}
          onRetry={props.onRetry}
          retryLabel={words.tryAgain}
          onDismiss={props.onDismissReturned}
          dismissLabel={words.dismiss}
          focusAfter={primary}
          style={styles.returned}
        />
      ) : (
        <Text variant="caption" color="secondary" align="center">
          {words.consequenceNarrow}
        </Text>
      )}
      <View style={styles.acts}>
        <Button variant="secondary" onClick={props.onCancel} style={styles.act}>
          {words.cancel}
        </Button>
        <View ref={primary} style={styles.act}>
          <Button
            variant="primary"
            loading={props.saving}
            onClick={props.saving ? undefined : props.onSubmit}
          >
            {words.primary}
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  foot: { gap: theme.spacing['sp-2'] },
  returned: { justifyContent: 'center' },
  acts: { flexDirection: 'row', gap: theme.spacing['sp-3'] },
  act: { flex: 1, minWidth: 0 },
});
