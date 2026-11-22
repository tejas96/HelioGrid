'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioEditing, StudioSaveState } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { theme } from '@heliogrid/theme';
import { IconButton, Menu, type MenuItem, ShellGlyph } from '@heliogrid/ui';
import { useRef } from 'react';

type Glyph = 'check' | 'cloud-off' | 'alert-circle' | 'eye' | 'clock';

interface Mark {
  readonly glyph: Glyph;
  readonly text: TranslatedText;
  readonly tone: 'success' | 'secondary' | 'warning';
  /** A state a person must hear about: a tap opens its words. */
  readonly loud: boolean;
}

/** Where saving stands, as a mark: Saved and Saving are quiet; every other state opens its words. */
function markOf(
  editing: StudioEditing,
  saving: StudioSaveState,
  words: StudioCanvasWords,
): Mark | null {
  if (editing.kind === 'opening') return null;
  if (editing.kind === 'view-only') {
    const text = editing.editor === null ? words.viewOnly : words.editingNow(editing.editor.name);
    return { glyph: 'eye', text, tone: 'secondary', loud: true };
  }
  switch (saving.kind) {
    case 'saving':
      return { glyph: 'clock', text: words.saving, tone: 'secondary', loud: false };
    case 'offline':
      return { glyph: 'cloud-off', text: words.offline, tone: 'warning', loud: true };
    case 'failed':
    case 'saved-first':
      return { glyph: 'alert-circle', text: words.failed, tone: 'warning', loud: true };
    default:
      return { glyph: 'check', text: words.saved, tone: 'success', loud: false };
  }
}

/**
 * The save mark in the steps' pill: whether each change is saved, waits for the connection, or is
 * view-only and whose turn it is. A mark names itself, so its words are spoken, never shown, and the
 * box is a live region that tells a screen reader each change. A state that needs the person opens
 * its words on a tap, with Try again for a save that failed, and the way out of the studio for a
 * save that cannot go now — the steps' way back waits for the save.
 */
export function StudioSaveMark({
  editing,
  saving,
  words,
  onRetry,
  onLeave,
}: {
  editing: StudioEditing;
  saving: StudioSaveState;
  words: StudioCanvasWords;
  onRetry: () => void;
  /** Out of the studio. */
  onLeave: () => void;
}) {
  const box = useRef<HTMLOutputElement>(null);
  const mark = markOf(editing, saving, words);
  if (mark === null) return null;
  const glyph = <ShellGlyph name={mark.glyph} size="md" tone={mark.tone} />;
  const items: MenuItem[] = [{ key: 'state', label: mark.text, icon: glyph, disabled: true }];
  if (saving.kind === 'failed' && editing.kind === 'editor') {
    items.push({
      key: 'retry',
      label: words.tryAgain,
      icon: <ShellGlyph name="retry" size="sm" tone="current" />,
      // Try again takes its own trigger away: the mark's box keeps the focus.
      onSelect: () => {
        onRetry();
        requestAnimationFrame(() => box.current?.focus());
      },
    });
  }
  if (editing.kind === 'editor' && mark.tone === 'warning') {
    items.push({
      key: 'leave',
      label: words.back,
      icon: <ShellGlyph name="chevron-left" size="sm" tone="current" />,
      onSelect: onLeave,
    });
  }
  return (
    <output ref={box} tabIndex={-1} className="hg-studio-save">
      <span className="hg-spoken-only">{mark.text}</span>
      {mark.loud ? (
        <Menu
          label={mark.text}
          align="end"
          items={items}
          trigger={
            <IconButton label={mark.text} variant="ghost" size={theme.layout['button-h-sm']}>
              {glyph}
            </IconButton>
          }
        />
      ) : (
        glyph
      )}
    </output>
  );
}
