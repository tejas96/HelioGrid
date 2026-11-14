import type { ComposedMessage } from '@heliogrid/contracts';
import { Text } from '../../primitives/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { EditorSurface } from '../EditorSurface';
import { HueTile } from '../HueTile';
import { AfterHint, AfterSummary, MessageBubble } from '../ProposalAfterParts';
import { copyGlyphOf, messageActsOf, messageSheetOf } from './MessageSheet.logic';
import type { MessageSheetProps } from './MessageSheet.types';
import './MessageSheet.css';

function Body(props: MessageSheetProps & { readonly composed: ComposedMessage }) {
  const { words, composed, notice, facts, failure } = props;
  const acts = messageActsOf(props, composed);
  const { out } = acts;
  return (
    <div className="hg-message-sheet" aria-busy={out ? true : undefined}>
      {notice === undefined || notice === null ? null : (
        <div className="hg-message-notice">
          <HueTile glyph="shield-check" hue="warning" size={40} stroke={1.7} />
          <span className="hg-message-notice-words">
            <b>{notice.title}</b>
            <span>{notice.line}</span>
          </span>
          {notice.act === undefined ? null : (
            <Button variant="secondary" size="sm" disabled={out} onClick={notice.act.onPress}>
              {notice.act.label}
            </Button>
          )}
        </div>
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
      <div className="hg-message-two" data-one={acts.pdf === null ? '' : undefined}>
        <Button
          {...acts.copy}
          icon={<ShellGlyph name={copyGlyphOf(words)} size="md" tone="primary" />}
        >
          {words.copy}
        </Button>
        {acts.pdf === null ? null : (
          <Button
            {...acts.pdf.button}
            icon={<ShellGlyph name="download" size="md" tone="primary" />}
          >
            {acts.pdf.label}
          </Button>
        )}
      </div>
      <AfterHint>{words.hint}</AfterHint>
    </div>
  );
}

/** A composed message, ready for a person to send — a sheet on a phone width, a decision above it. */
export function MessageSheet(props: MessageSheetProps) {
  const { open, message } = props;
  return (
    <EditorSurface {...messageSheetOf(props)} showClose desktop="modal">
      {open && message.kind === 'ready' ? <Body {...props} composed={message.value} /> : null}
    </EditorSurface>
  );
}
