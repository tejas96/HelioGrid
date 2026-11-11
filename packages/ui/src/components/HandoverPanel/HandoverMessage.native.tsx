import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Card } from '../Card/Card.native';
import { type HandoverMessageAct, messageActsOf } from './HandoverPanel.logic';
import type { HandoverMessageProps } from './HandoverPanel.types';

/**
 * The ready message on the phone, in the customer's own language as the company wrote it, and
 * once handed over the share sheet — which holds Copy and the person's own apps. Nothing here says
 * it was delivered.
 */
export function HandoverMessage(props: HandoverMessageProps) {
  const { words, message, copied, sendable } = props;
  const acts = sendable ? messageActsOf(props) : [];
  return (
    <Card>
      <View style={styles.card}>
        <Text variant="overline" color="secondary">
          {words.message(message.language)}
        </Text>
        <MessageText text={message.text} language={message.language} />
        {acts.length === 0 ? null : <View style={styles.acts}>{acts.map(actOf)}</View>}
        {copied ? (
          <View accessibilityLiveRegion="polite">
            <StatusMark tone="success" label={words.copied} />
          </View>
        ) : null}
        {sendable ? (
          <Text variant="caption" color="secondary">
            {words.noDelivery}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

/** The message as the company wrote it, in a well of the tile's control fill. */
function MessageText({ text, language }: { text: string; language: string }) {
  const { controlFill } = useGround();
  return (
    <View style={[styles.well, { backgroundColor: controlFill }]}>
      <Text variant="body" lang={language}>
        {text}
      </Text>
    </View>
  );
}

function actOf({ key, glyph, label, onPress }: HandoverMessageAct) {
  const icon = <ShellGlyph name={glyph} size="sm" tone="primary" />;
  return (
    <Button key={key} variant="secondary" size="md" icon={icon} onClick={onPress}>
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.spacing['sp-3'] },
  well: {
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-tile'],
  },
  acts: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
});
