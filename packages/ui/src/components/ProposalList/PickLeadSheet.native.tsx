import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { HueTile } from '../HueTile/HueTile.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { failedReadOf } from '../ProposalAfterParts/ProposalAfterParts.logic';
import { AfterHint } from '../ProposalAfterParts/ProposalAfterParts.native';
import { SearchField } from '../SearchField/SearchField.native';
import { pickLeadSheetOf } from './ProposalList.logic';
import type { PickLeadSheetProps } from './ProposalList.types';

function Leads(props: PickLeadSheetProps) {
  const { leads, words, pendingId } = props;
  if (leads.kind === 'loading') {
    return <LoadingBars bars={['option', 'option', 'option']} label={words.loading} />;
  }
  if (leads.kind === 'failed') {
    return <FailedRead {...failedReadOf(words, leads.retry, props.focusAfter)} />;
  }
  if (leads.kind === 'empty' || leads.value.length === 0) {
    return (
      <Text variant="body-sm" color="secondary">
        {words.none}
      </Text>
    );
  }
  return (
    <>
      {leads.value.map((lead) => (
        <Pressable
          key={lead.id}
          disabled={pendingId !== null}
          accessibilityState={{ busy: pendingId === lead.id }}
          onPress={() => props.onPick(lead.id)}
        >
          <View style={styles.row}>
            <Avatar name={lead.name} size={40} />
            <View style={styles.grow}>
              <Text variant="body" bold>
                {lead.name}
              </Text>
              <Text variant="body-sm" color="secondary">
                {lead.line}
              </Text>
            </View>
            <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
          </View>
        </Pressable>
      ))}
    </>
  );
}

/** *Copy for which customer?*, on the phone. */
export function PickLeadSheet(props: PickLeadSheetProps) {
  const { open, words, failure } = props;
  const frame = pickLeadSheetOf(props);
  const { out } = frame;
  return (
    <EditorSurface {...frame.sheet} showClose desktop="modal">
      {open ? (
        <View style={styles.body}>
          <SearchField {...frame.search} />
          <View>
            <Leads {...props} />
            <Pressable disabled={out} onPress={props.onNewCustomer}>
              <View style={styles.row}>
                <HueTile glyph="plus" hue="ocean" size={40} />
                <View style={styles.grow}>
                  <Text variant="body" bold>
                    {words.newCustomer}
                  </Text>
                  <Text variant="body-sm" color="secondary">
                    {words.newCustomerLine}
                  </Text>
                </View>
                <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
              </View>
            </Pressable>
          </View>
          {failure === null ? null : (
            <Text variant="body-sm" color="danger" live>
              {failure}
            </Text>
          )}
          <AfterHint>{words.hint}</AfterHint>
        </View>
      ) : null}
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  grow: { flex: 1, minWidth: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-2'],
  },
});
