'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioEditing, StudioSaveState } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { theme } from '@heliogrid/theme';
import { Button, IconButton, ShellGlyph } from '@heliogrid/ui';

type Glyph = 'check' | 'cloud-off' | 'alert-circle' | 'eye' | 'clock';

/** The pill's mark and words for where saving stands; the phone shows the words for all but Saved. */
function pillOf(
  editing: StudioEditing,
  saving: StudioSaveState,
  words: StudioCanvasWords,
): { readonly glyph: Glyph; readonly text: TranslatedText; readonly tone: string } | null {
  if (editing.kind === 'opening') return null;
  if (editing.kind === 'view-only') {
    const text = editing.editor === null ? words.viewOnly : words.editingNow(editing.editor.name);
    return { glyph: 'eye', text, tone: 'quiet' };
  }
  switch (saving.kind) {
    case 'saving':
      return { glyph: 'clock', text: words.saving, tone: 'quiet' };
    case 'offline':
      return { glyph: 'cloud-off', text: words.offline, tone: 'warning' };
    case 'failed':
    case 'saved-first':
      return { glyph: 'alert-circle', text: words.failed, tone: 'warning' };
    default:
      return { glyph: 'check', text: words.saved, tone: 'success' };
  }
}

/**
 * The studio's top bar: the way back, the design's name and the Saved pill — which says, in words
 * and a mark, whether each change is saved, waits for the connection, or is view-only and whose
 * turn it is.
 */
export function StudioTopBar({
  name,
  editing,
  saving,
  words,
  onBack,
  onRetry,
}: {
  name: TranslatedText;
  editing: StudioEditing;
  saving: StudioSaveState;
  words: StudioCanvasWords;
  onBack: () => void;
  onRetry: () => void;
}) {
  const pill = pillOf(editing, saving, words);
  return (
    <div className="hg-studio-glass hg-studio-top">
      <IconButton
        label={words.back}
        variant="ghost"
        size={theme.layout['button-h-sm']}
        onClick={onBack}
      >
        <ShellGlyph name="chevron-left" size="md" />
      </IconButton>
      <span className="hg-studio-name">{name}</span>
      {pill === null ? null : (
        <output
          className="hg-studio-pill"
          data-tone={pill.tone}
          data-saved={pill.glyph === 'check'}
          aria-label={pill.text}
        >
          <ShellGlyph name={pill.glyph} size="sm" />
          <span className="hg-studio-pill-words">{pill.text}</span>
        </output>
      )}
      {saving.kind === 'failed' && editing.kind === 'editor' ? (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          {words.tryAgain}
        </Button>
      ) : null}
    </div>
  );
}
