import type { MouseEvent, ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { ToolCommand } from './RichText.commands';
import { CMD, LINK_GLYPH } from './RichText.commands';
import type { RichTextTemplate } from './RichText.types';

interface ToolButtonProps {
  active?: boolean;
  label: string;
  glyph?: ShellGlyphName;
  onMouseDown: (e: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
}

/**
 * A toolbar button cannot go through the `Pressable` primitive: it acts on `mousedown` with
 * `preventDefault`, which is the ONLY thing that keeps the caret selection alive while the
 * command runs. Pressable is a click primitive. The 44px floor is held in RichText.css instead.
 */
export function ToolButton({
  active = false,
  label,
  glyph,
  onMouseDown,
  children,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      className="hg-rich-text-tool"
      aria-label={label}
      aria-pressed={active}
      data-active={active}
      data-wide={children !== undefined}
      onMouseDown={onMouseDown}
    >
      {children ?? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {glyph === undefined ? null : <ShellGlyphMarks name={glyph} />}
        </svg>
      )}
    </button>
  );
}

interface RichTextToolbarProps {
  marks: Partial<Record<ToolCommand['key'], boolean>>;
  disabled: boolean;
  hasLogo: boolean;
  linking: boolean;
  templates?: RichTextTemplate[];
  saveTemplateLabel: string;
  onRun: (e: MouseEvent<HTMLButtonElement>, c: ToolCommand) => void;
  onToggleLink: () => void;
  onToggleLogo: () => void;
  onLoadTemplate?: (id: string) => void;
  onSaveAsTemplate?: () => void;
}

/** Every button is 44px, and every mark it can produce is in `RichTextView`. */
export function RichTextToolbar({
  marks,
  disabled,
  hasLogo,
  linking,
  templates,
  saveTemplateLabel,
  onRun,
  onToggleLink,
  onToggleLogo,
  onLoadTemplate,
  onSaveAsTemplate,
}: RichTextToolbarProps) {
  return (
    <div className="hg-rich-text-toolbar" role="toolbar" aria-label="Formatting">
      {CMD.map((c) => (
        <ToolButton
          key={c.key}
          label={c.label}
          glyph={c.glyph}
          active={marks[c.key] === true}
          onMouseDown={(e) => onRun(e, c)}
        />
      ))}
      <ToolButton
        label="Link"
        glyph={LINK_GLYPH}
        active={linking}
        onMouseDown={(e) => {
          e.preventDefault();
          onToggleLink();
        }}
      />
      <span className="hg-rich-text-divider" aria-hidden="true" />
      <ToolButton
        label={hasLogo ? 'Remove the logo' : 'Add the logo'}
        active={hasLogo}
        onMouseDown={(e) => {
          e.preventDefault();
          onToggleLogo();
        }}
      >
        {hasLogo ? 'Logo on' : 'Add logo'}
      </ToolButton>
      <span className="hg-rich-text-spacer" />
      {templates !== undefined && templates.length > 0 ? (
        <select
          className="hg-rich-text-templates"
          aria-label="Load a saved template"
          disabled={disabled}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value !== '') onLoadTemplate?.(e.target.value);
            e.target.value = '';
          }}
        >
          <option value="">Load template…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      ) : null}
      {onSaveAsTemplate !== undefined ? (
        <ToolButton
          label={saveTemplateLabel}
          onMouseDown={(e) => {
            e.preventDefault();
            onSaveAsTemplate();
          }}
        >
          {saveTemplateLabel}
        </ToolButton>
      ) : null}
    </div>
  );
}
