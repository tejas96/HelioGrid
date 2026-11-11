import { StatusMark } from '../../primitives/StatusMark';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Card } from '../Card';
import { type HandoverMessageAct, messageActsOf } from './HandoverPanel.logic';
import type { HandoverMessageProps } from './HandoverPanel.types';

/**
 * The ready message in the customer's own language, as the company wrote it and selectable; once
 * handed over, the person's own ways to send it — the share sheet, or Copy. Nothing here says it
 * was delivered.
 */
export function HandoverMessage(props: HandoverMessageProps) {
  const { words, message, copied, sendable } = props;
  const acts = sendable ? messageActsOf(props) : [];
  return (
    <Card className="hg-handover-message">
      <span className="hg-handover-overline">{words.message(message.language)}</span>
      <p lang={message.language} className="hg-handover-message-text">
        {message.text}
      </p>
      {acts.length === 0 ? null : <div className="hg-handover-message-acts">{acts.map(actOf)}</div>}
      {copied ? (
        <span role="status">
          <StatusMark tone="success" label={words.copied} />
        </span>
      ) : null}
      {sendable ? (
        <Text variant="caption" color="secondary">
          {words.noDelivery}
        </Text>
      ) : null}
    </Card>
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
