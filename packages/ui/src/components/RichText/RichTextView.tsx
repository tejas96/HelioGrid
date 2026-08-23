import type { CSSProperties, ReactNode } from 'react';
import { foldRows, isListBlock, keyed } from './RichText.model';
import type {
  RichTextBlock,
  RichTextListBlock,
  RichTextRow,
  RichTextSpan,
  RichTextViewProps,
} from './RichText.types';

interface WebRichTextViewProps extends RichTextViewProps {
  className?: string;
  style?: CSSProperties;
}

function renderSpans(spans: RichTextSpan[], prefix: string): ReactNode[] {
  return keyed(spans, prefix).map(({ key, item }) => {
    const node = (
      <span
        key={key}
        style={{
          fontWeight: item.b === true ? 700 : undefined,
          fontStyle: item.i === true ? 'italic' : undefined,
        }}
      >
        {item.text}
      </span>
    );
    return item.href === undefined ? (
      node
    ) : (
      <a key={key} className="hg-rich-text-link" href={item.href}>
        {node}
      </a>
    );
  });
}

function LogoRow({
  logoSrc,
  logoLabel,
  fontSize,
}: {
  logoSrc?: string;
  logoLabel: string;
  fontSize: number;
}) {
  const height = Math.round(fontSize * 2.4);
  return (
    <div data-flow-row="" className="hg-rich-text-logo-row">
      {logoSrc === undefined ? (
        <span
          className="hg-rich-text-logo-slot"
          style={{ width: Math.round(fontSize * 6), height, fontSize: Math.max(9, fontSize - 4) }}
        >
          {logoLabel}
        </span>
      ) : (
        <img src={logoSrc} alt="" style={{ height }} />
      )}
    </div>
  );
}

/**
 * The ITEMS are the rows, never the list: a 30-item list that could only break as a whole would
 * be one page-tall atom. `start` is carried so a continued `ol` keeps its numbering.
 */
function ListRows({
  block,
  prefix,
  fontSize,
  gap,
  muted,
}: {
  block: RichTextListBlock;
  prefix: string;
  fontSize: number;
  gap: number;
  muted?: string;
}) {
  const style = { margin: `0 0 ${gap}px`, paddingLeft: Math.round(fontSize * 1.4), color: muted };
  const items = keyed(block.items, `${prefix}-i`).map((entry) => (
    <li key={entry.key} data-flow-row="" className="hg-rich-text-li">
      {renderSpans(entry.item, `${entry.key}-s`)}
    </li>
  ));
  if (block.type === 'ul') return <ul style={style}>{items}</ul>;
  return (
    <ol start={block.start} style={style}>
      {items}
    </ol>
  );
}

/* A paragraph directly under a heading is that heading's NOTE, so the two stay on one sheet.
   Everything else is a row of its own. */
function rowAttr(prev: RichTextBlock | undefined, b: RichTextBlock) {
  return prev !== undefined && prev.type === 'h' && b.type === 'p'
    ? { 'data-flow-row-note': '' }
    : { 'data-flow-row': '' };
}

/**
 * **The read-only rendering of every mark the editor produces** — one implementation for the
 * document, the customer link page and every export, so the three cannot drift.
 *
 * **It declares its flow rows**, so a page surface can cut it: every paragraph, heading, logo and
 * list *item* carries `data-flow-row`, and a paragraph directly under a heading carries
 * `data-flow-row-note`. Without those attributes a terms section declared as `rows` measures zero
 * rows and is dropped from the document.
 *
 * The inline sizes below are FUNCTIONS OF `fontSize`, which is the caller's prop — a document
 * sheet renders at 11 and a screen at 14. They cannot live in the stylesheet as fixed values.
 */
export function RichTextView({
  value,
  logoSrc,
  logoLabel = 'tenant logo',
  fontSize = 14,
  color,
  muted,
  emptyText,
  className,
  style,
}: WebRichTextViewProps) {
  const blocks = value?.blocks ?? [];
  if (blocks.length === 0) {
    return emptyText === undefined ? null : (
      <p className="hg-rich-text-empty" style={{ fontSize }}>
        {emptyText}
      </p>
    );
  }
  const gap = Math.round(fontSize * 0.7);
  return (
    <div
      className={['hg-rich-text-view', className].filter((c) => c !== undefined).join(' ')}
      style={{ fontSize, color, ...style }}
    >
      {keyed(blocks, 'b').map(({ key, item: b }, i) => {
        if (b.type === 'logo') {
          return <LogoRow key={key} logoSrc={logoSrc} logoLabel={logoLabel} fontSize={fontSize} />;
        }
        if (isListBlock(b)) {
          return (
            <ListRows
              key={key}
              block={b}
              prefix={key}
              fontSize={fontSize}
              gap={gap}
              muted={muted}
            />
          );
        }
        if (b.type === 'h') {
          return (
            <p
              key={key}
              data-flow-row=""
              className="hg-rich-text-h"
              style={{
                margin: `${i > 0 ? fontSize : 0}px 0 ${Math.round(fontSize * 0.4)}px`,
                fontSize: fontSize + 1,
              }}
            >
              {renderSpans(b.spans, `${key}-s`)}
            </p>
          );
        }
        return (
          <p
            key={key}
            {...rowAttr(blocks[i - 1], b)}
            style={{ margin: `0 0 ${gap}px`, color: muted }}
          >
            {renderSpans(b.spans, `${key}-s`)}
          </p>
        );
      })}
    </div>
  );
}

/** Renders a chunk of rows — adjacent list rows fold back into one list with numbering intact. */
export function renderRichTextRows(
  rows: RichTextRow[],
  props?: Omit<RichTextViewProps, 'value'>,
): ReactNode {
  return <RichTextView value={{ version: 1, blocks: foldRows(rows) }} {...props} />;
}
