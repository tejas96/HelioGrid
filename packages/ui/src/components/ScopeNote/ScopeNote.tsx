import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { ScopeNoteProps, ScopeNoteSpec } from './ScopeNote.types';
import { composeScopeLine, scopeNoteFor, scopeNoteSize } from './scope-note-line';

/** The caller-set type size rides in as a custom property so the rules stay in ScopeNote.css. */
type NoteVars = CSSProperties & Record<`--${string}`, string>;

type WebScopeNoteProps = ScopeNoteProps & {
  className?: string;
  style?: CSSProperties;
};

/**
 * A person: whose act this is. Not a lock — the screen is not locked, and the reader is not shut
 * out of anything they can see.
 */
function Glyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ShellGlyphMarks name="person" />
    </svg>
  );
}

/**
 * THE PERMISSION ANSWER TO "WHY IS THIS OFF", and it is a different answer from ActionReason
 * because the act is not off — THE ACT IS GONE, and this names whose it is.
 *
 * It renders IN THE ACTION ROW, the exact place the absent acts would have been. Not a Banner
 * (per-surface, and these surfaces are working normally), not an UnavailableNote (that is about
 * content, and here the content is fully present and readable).
 */
export function ScopeNote(props: WebScopeNoteProps) {
  const { message, action, variant = 'line', align = 'left', size = 13, className, style } = props;
  const line = composeScopeLine(props);
  if (line === null && message === undefined) {
    return null;
  }
  const vars: NoteVars = { '--hg-scope-note-size': `${scopeNoteSize(size)}px` };
  return (
    <div
      role="note"
      data-variant={variant}
      data-align={align}
      className={classNames(scopeNotePanelFrame.className, className)}
      style={{ ...vars, ...style }}
    >
      <span className="hg-scope-note-mark">
        <Glyph />
      </span>
      <div className="hg-scope-note-lines">
        {line !== null ? <p className="hg-scope-note-line">{line}</p> : null}
        {message !== undefined ? <p className="hg-scope-note-message">{message}</p> : null}
        {action}
      </div>
    </div>
  );
}

/** Accepts a `scope` host prop — a spec object or a ready node. */
export function renderScopeNote(
  spec?: ScopeNoteSpec | ReactNode,
  extra: Pick<ScopeNoteSpec, 'variant' | 'align' | 'size'> = {},
): ReactNode {
  return scopeNoteFor(spec, (plain) => <ScopeNote {...plain} {...extra} />);
}

/** The panel's frame, for a wait that stands in for a panel note and must keep its size. */
export const scopeNotePanelFrame = { className: 'hg-scope-note', 'data-variant': 'panel' } as const;
