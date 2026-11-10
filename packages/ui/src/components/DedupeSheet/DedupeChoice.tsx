import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { IconCircle } from '../Card';
import { PendingAction } from '../PendingAction';
import { actLineOf, choiceLookOf, isActWaiting } from './DedupeSheet.logic';
import type { DedupeChoiceProps } from './DedupeSheet.types';

/**
 * One of the sheet's three choices: its mark, its title, the one line under it, and — when
 * its act is out or came back — that line in its place beneath.
 */
export function DedupeChoice({
  choice,
  choiceWords,
  record,
  act,
  onPress,
  expanded,
  words,
}: DedupeChoiceProps) {
  const look = choiceLookOf(choice, record);
  const line = actLineOf(choice, act, words);
  return (
    <div className="hg-dedupe-choice-slot">
      <Pressable
        className="hg-dedupe-choice"
        onPress={onPress}
        accessibilityState={{ busy: isActWaiting(act) && act?.choice === choice, expanded }}
      >
        <IconCircle color={look.circle} size={44}>
          <ShellGlyph name={look.glyph} size="md" tone={look.tone} />
        </IconCircle>
        <span className="hg-dedupe-choice-words">
          <span className="hg-dedupe-choice-title">{choiceWords.title}</span>
          <span className="hg-dedupe-choice-line">{choiceWords.line}</span>
        </span>
        <ShellGlyph
          name={expanded === undefined ? 'chevron-right' : 'chevron'}
          size="sm"
          tone="secondary"
        />
      </Pressable>
      {line === null ? null : <PendingAction {...line} />}
    </div>
  );
}
