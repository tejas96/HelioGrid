import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { AfterHint, AfterSummary } from '../ProposalAfterParts/ProposalAfterParts.native';
import { Sheet } from '../Sheet/Sheet.native';
import { withdrawSheetOf } from './ProposalWithdrawSheet.logic';
import type { ProposalWithdrawSheetProps } from './ProposalWithdrawSheet.types';

/** The confirm leaves with the sheet: focus then lands on the caller's `focusAfter`. */
function Confirm(props: ProposalWithdrawSheetProps) {
  const leaving = useFocusAfter(props.focusAfter);
  const { confirm } = withdrawSheetOf(props);
  if (props.words === null) return null;
  return (
    <Button {...confirm} onClick={leaving(confirm.onClick)}>
      {props.words.confirm}
    </Button>
  );
}

/** Withdraw one of two proposals, on the phone. */
export function ProposalWithdrawSheet(props: ProposalWithdrawSheetProps) {
  const { open, words, failure } = props;
  const frame = withdrawSheetOf(props);
  return (
    <Sheet {...frame.sheet} showClose>
      {open && words !== null ? (
        <View style={styles.body}>
          <AfterSummary rows={words.summary} />
          <AfterHint>{words.hint}</AfterHint>
          {failure === null ? null : (
            <Text variant="body-sm" color="danger" live>
              {failure}
            </Text>
          )}
          <Confirm {...props} />
          <Text variant="caption" color="secondary" align="center">
            {words.note}
          </Text>
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({ body: { gap: theme.spacing['sp-4'] } });
