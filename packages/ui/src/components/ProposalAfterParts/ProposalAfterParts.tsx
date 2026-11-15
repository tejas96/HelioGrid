import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { HueTile } from '../HueTile';
import { bubbleLines } from './ProposalAfterParts.logic';
import type {
  AfterHintProps,
  AfterRowProps,
  AfterRowsProps,
  AfterSummaryProps,
  MessageBubbleProps,
} from './ProposalAfterParts.types';
import './ProposalAfterParts.css';

export function AfterHint({ glyph = 'info-circle', children }: AfterHintProps) {
  return (
    <p className="hg-after-hint">
      <ShellGlyph name={glyph} size="sm" tone="secondary" />
      <span>{children}</span>
    </p>
  );
}

export function AfterSummary({ rows }: AfterSummaryProps) {
  return (
    <dl className="hg-after-summary">
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd data-mono={row.mono ? '' : undefined}>
            {row.value}
            {row.figure === undefined ? null : (
              <>
                {' · '}
                <span data-mono="">{row.figure}</span>
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function AfterRows({ children }: AfterRowsProps) {
  return <div className="hg-after-rows">{children}</div>;
}

function RowFace({ glyph, hue = 'ocean', title, line, leading }: AfterRowProps) {
  return (
    <>
      {leading ??
        (glyph === undefined ? null : <HueTile glyph={glyph} hue={hue} size={36} stroke={1.7} />)}
      <span className="hg-after-row-words">
        <b>{title}</b>
        {line === undefined ? null : <span>{line}</span>}
      </span>
    </>
  );
}

export function AfterRow(props: AfterRowProps) {
  const { onOpen, aside } = props;
  if (onOpen === undefined || aside !== undefined) {
    return (
      <div className="hg-after-row">
        <RowFace {...props} />
        {aside === undefined ? null : <span className="hg-after-row-aside">{aside}</span>}
      </div>
    );
  }
  return (
    <Pressable className="hg-after-row" onPress={onOpen}>
      <RowFace {...props} />
      <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
    </Pressable>
  );
}

export function MessageBubble({ text, link, linkToCome, note, name }: MessageBubbleProps) {
  return (
    <section className="hg-after-bubble" aria-label={name}>
      {bubbleLines(text, link, linkToCome).map((line, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a message's lines keep their order and may repeat
        <p key={index} data-kind={line.kind}>
          {line.text}
        </p>
      ))}
      <span className="hg-after-bubble-note">{note}</span>
    </section>
  );
}
