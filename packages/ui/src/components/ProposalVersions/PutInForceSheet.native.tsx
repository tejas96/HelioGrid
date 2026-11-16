import type { VersionInForcePreview } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import {
  AfterHint,
  AfterRow,
  AfterRows,
  AfterSummary,
} from '../ProposalAfterParts/ProposalAfterParts.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { inForcePartOf, inForceSheetOf } from './ProposalVersions.logic';
import type { PutInForceSheetProps } from './ProposalVersions.types';

function Body(props: PutInForceSheetProps & { readonly facts: VersionInForcePreview }) {
  const { words, facts, sending, failure } = props;
  return (
    <View style={styles.body}>
      <AfterSummary rows={words.summary(facts)} />
      <Text variant="overline" color="secondary">
        {words.planTitle}
      </Text>
      <AfterRows>
        {facts.plan.map((part, index) => {
          const row = inForcePartOf(words, part, facts.plan);
          return (
            <AfterRow
              // biome-ignore lint/suspicious/noArrayIndexKey: a plan's parts keep their order and may repeat a name
              key={index}
              {...row.row}
              aside={
                <View style={styles.aside}>
                  {row.chip === null ? null : <StatusChip {...row.chip} density="functional" />}
                  <Text variant="mono">{row.amount}</Text>
                </View>
              }
            />
          );
        })}
      </AfterRows>
      <AfterHint>{words.hint}</AfterHint>
      {failure === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {failure}
        </Text>
      )}
      <Button variant="primary" size="lg" fullWidth loading={sending} onClick={props.onConfirm}>
        {words.confirm}
      </Button>
      <Text variant="caption" color="secondary" align="center">
        {words.recorded}
      </Text>
    </View>
  );
}

/** *Put version N in force*, on the phone. */
export function PutInForceSheet(props: PutInForceSheetProps) {
  const { open, preview } = props;
  return (
    <EditorSurface {...inForceSheetOf(props)} showClose desktop="modal">
      {open && preview.kind === 'ready' ? <Body {...props} facts={preview.value} /> : null}
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  aside: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
});
