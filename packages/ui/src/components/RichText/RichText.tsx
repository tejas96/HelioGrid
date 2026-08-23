import type { CSSProperties, MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ToolCommand } from './RichText.commands';
import { EMPTY_RICH_TEXT, measure, richTextRows } from './RichText.model';
import { LOGO_HTML, serialise, toHtml } from './RichText.serialise';
import type { RichTextProps, RichTextValue } from './RichText.types';
import { RichTextToolbar } from './RichTextToolbar';
import { RichTextView, renderRichTextRows } from './RichTextView';

interface WebRichTextProps extends RichTextProps {
  className?: string;
  style?: CSSProperties;
}

type MarkState = Partial<Record<ToolCommand['key'], boolean>>;

/**
 * **Rich-text authoring for `M06-15` step 9** (Terms & Conditions, up to 3 pages) — and it ships
 * with its renderer, because `M06-51`'s *"one computed value set feeds the document, the link and
 * every export"* means this content is read in three places the author never sees.
 *
 * **The mark set is closed and small:** bold · italic · heading · bulleted list · numbered list ·
 * link · inline logo. No colours, no fonts, no sizes, no alignment, no tables. The whitelist is
 * **enforced by the serialiser**, so a paste from Word cannot smuggle a font into a customer's
 * document.
 */
export function RichText({
  value = EMPTY_RICH_TEXT,
  onChange,
  onCommit,
  label,
  helper,
  placeholder = 'Type the terms your customer will read.',
  minHeight = 260,
  maxLength,
  disabled = false,
  onLogoChange,
  templates,
  onLoadTemplate,
  onSaveAsTemplate,
  saveTemplateLabel = 'Save as template',
  pageEstimate,
  onMeasure,
  className,
  style,
}: WebRichTextProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastHtml = useRef('');
  const [marks, setMarks] = useState<MarkState>({});
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState('https://');
  const [focus, setFocus] = useState(false);
  const m = measure(value);
  const hasLogo = m.hasLogo;

  /* The DOM is written from the value only when the value came from OUTSIDE (a template load, a
     reset). Rewriting it on our own serialisation would move the caret on every keystroke. */
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const html = toHtml(value);
    if (html === lastHtml.current) return;
    lastHtml.current = html;
    el.innerHTML = html;
  }, [value]);

  /* Without this a paragraph is a <div> on some engines. The serialiser treats an unknown block
     as a paragraph anyway, so this only keeps the editor's own HTML honest. */
  useEffect(() => {
    if (typeof document.queryCommandSupported === 'function') {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    }
  }, []);

  const readMarks = () => {
    const state: MarkState = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      ul: document.queryCommandState('insertUnorderedList'),
      ol: document.queryCommandState('insertOrderedList'),
      h: /^h[1-4]$/i.test(document.queryCommandValue('formatBlock')),
    };
    setMarks(state);
  };

  const push = (): RichTextValue | undefined => {
    const el = ref.current;
    if (el === null) return undefined;
    const next = serialise(el);
    lastHtml.current = toHtml(next);
    onChange?.(next);
    onMeasure?.(measure(next));
    return next;
  };

  const run = (e: MouseEvent<HTMLButtonElement>, c: ToolCommand) => {
    e.preventDefault();
    if (disabled) return;
    ref.current?.focus();
    document.execCommand(c.cmd, false, c.arg);
    /* A second press on Heading returns the block to a paragraph. */
    if (c.key === 'h' && marks.h === true) document.execCommand('formatBlock', false, 'p');
    readMarks();
    push();
  };

  const toggleLogo = () => {
    const el = ref.current;
    if (el === null || disabled) return;
    if (hasLogo) el.querySelector('[data-rt-logo]')?.remove();
    else el.insertAdjacentHTML('afterbegin', LOGO_HTML);
    const next = push();
    if (next !== undefined) onLogoChange?.(!hasLogo, next);
  };

  const applyLink = () => {
    ref.current?.focus();
    document.execCommand('createLink', false, href);
    setLinking(false);
    push();
  };

  const over = maxLength !== undefined && m.chars > maxLength;

  return (
    <div className={classNames('hg-rich-text', className)} style={style}>
      {label !== undefined ? <div className="hg-rich-text-label">{label}</div> : null}
      <div className="hg-rich-text-frame" data-focus={focus}>
        <RichTextToolbar
          marks={marks}
          disabled={disabled}
          hasLogo={hasLogo}
          linking={linking}
          templates={templates}
          saveTemplateLabel={saveTemplateLabel}
          onRun={run}
          onToggleLink={() => setLinking((v) => !v)}
          onToggleLogo={toggleLogo}
          onLoadTemplate={onLoadTemplate}
          onSaveAsTemplate={
            onSaveAsTemplate === undefined
              ? undefined
              : () => onSaveAsTemplate(value, measure(value))
          }
        />
        {linking ? (
          <div className="hg-rich-text-link-row">
            <input
              className="hg-rich-text-href"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              aria-label="Link address"
              placeholder="https://"
            />
            <button type="button" className="hg-rich-text-apply" onClick={applyLink}>
              Add link
            </button>
          </div>
        ) : null}
        <div className="hg-rich-text-body">
          {m.chars === 0 && !hasLogo ? (
            <span className="hg-rich-text-placeholder" aria-hidden="true">
              {placeholder}
            </span>
          ) : null}
          {/* biome-ignore lint/a11y/useSemanticElements: a textbox with marks is a
              contenteditable; no HTML element carries bold, lists and a logo placement. */}
          <div
            ref={ref}
            className="hg-rich-text-editable"
            style={{ minHeight }}
            contentEditable={!disabled}
            suppressContentEditableWarning
            role="textbox"
            tabIndex={0}
            aria-multiline="true"
            aria-label={label ?? 'Terms and conditions'}
            onInput={() => push()}
            onFocus={() => {
              setFocus(true);
              readMarks();
            }}
            onBlur={() => {
              setFocus(false);
              const next = push();
              onCommit?.(next ?? value);
            }}
            onKeyUp={readMarks}
            onMouseUp={readMarks}
          />
        </div>
      </div>
      {/* The char count is REAL and ships. The page estimate is the caller's, and empty stays
          empty — the editor never prints "≈ 1 page" it cannot stand behind. */}
      <div className="hg-rich-text-footer">
        <span className="hg-rich-text-helper">{helper}</span>
        <span className="hg-rich-text-count" data-over={over}>
          {pageEstimate}
          <span>
            {maxLength !== undefined
              ? `${m.chars}/${maxLength} characters`
              : `${m.chars} characters`}
          </span>
        </span>
      </div>
    </div>
  );
}

RichText.View = RichTextView;
RichText.measure = measure;
RichText.rows = richTextRows;
RichText.renderRows = renderRichTextRows;
RichText.EMPTY = EMPTY_RICH_TEXT;
