import type { ComposedMessage } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { HueTile } from '../HueTile/HueTile.native';
import {
  AfterHint,
  AfterSummary,
  MessageBubble,
} from '../ProposalAfterParts/ProposalAfterParts.native';
import { Sheet } from '../Sheet/Sheet.native';
import { copyGlyphOf, messageActsOf, messageSheetOf } from './MessageSheet.logic';
import type { MessageSheetProps } from './MessageSheet.types';

function Body(props: MessageSheetProps & { readonly composed: ComposedMessage }) {
  const { words, composed, notice, facts, failure } = props;
  const acts = messageActsOf(props, composed);
  const { out } = acts;
  return (
    <View style={styles.body}>
      {notice === undefined || notice === null ? null : (
        <View style={styles.notice}>
          <HueTile glyph="shield-check" hue="warning" size={40} stroke={1.7} />
          <View style={styles.grow}>
            <Text variant="body" bold color="warning">
              {notice.title}
            </Text>
            <Text variant="body-sm" color="warning">
              {notice.line}
            </Text>
          </View>
          {notice.act === undefined ? null : (
            <Button variant="secondary" size="sm" disabled={out} onClick={notice.act.onPress}>
              {notice.act.label}
            </Button>
          )}
        </View>
      )}
      {facts === undefined || facts.length === 0 ? null : <AfterSummary rows={facts} />}
      <MessageBubble {...acts.bubble} />
      {failure === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {failure}
        </Text>
      )}
      <Button {...acts.share} icon={<ShellGlyph name="chat" size="md" tone="inverse" />}>
        {words.share}
      </Button>
      <View style={styles.two}>
        <View style={styles.grow}>
          <Button
            {...acts.copy}
            icon={<ShellGlyph name={copyGlyphOf(words)} size="md" tone="primary" />}
          >
            {words.copy}
          </Button>
        </View>
        {acts.pdf === null ? null : (
          <View style={styles.grow}>
            <Button
              {...acts.pdf.button}
              icon={<ShellGlyph name="download" size="md" tone="primary" />}
            >
              {acts.pdf.label}
            </Button>
          </View>
        )}
      </View>
      <AfterHint>{words.hint}</AfterHint>
    </View>
  );
}

/** A composed message, ready for a person to send — one sheet on the phone. */
export function MessageSheet(props: MessageSheetProps) {
  const { open, message } = props;
  return (
    <Sheet {...messageSheetOf(props)} showClose>
      {open && message.kind === 'ready' ? <Body {...props} composed={message.value} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  grow: { flex: 1, minWidth: 0 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-lg'],
    backgroundColor: colors['warning-bg'],
  },
  two: { flexDirection: 'row', gap: theme.spacing['sp-3'] },
});
