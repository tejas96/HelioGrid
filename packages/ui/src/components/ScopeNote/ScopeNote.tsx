import type { CSSProperties, ReactNode } from 'react';
import { isValidElement } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ScopeNoteProps, ScopeNoteSpec } from './ScopeNote.types';
import { composeScopeLine, scopeNoteSize } from './scope-note-line';

/** The caller-set type size rides in as a custom property so the rules stay in ScopeNote.css. */
type NoteVars = CSSProperties & Record<`--${string}`, string>;

interface WebScopeNoteProps extends ScopeNoteProps {
  className?: string;
  style?: CSSProperties;
}

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
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20a7 7 0 0 1 14 0" />
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
export function ScopeNote({
  holder,
  acts,
  title,
  message,
  action,
  variant = 'line',
  align = 'left',
  size = 13,
  className,
  style,
}: WebScopeNoteProps) {
  const line = composeScopeLine({ holder, acts, title });
  if (line === null && message === undefined) {
    return null;
  }
  const vars: NoteVars = { '--hg-scope-note-size': `${scopeNoteSize(size)}px` };
  return (
    <div
      role="note"
      data-variant={variant}
      data-align={align}
      className={classNames('hg-scope-note', className)}
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

/** A plain spec object, as opposed to any of the object shapes ReactNode itself allows. */
function isScopeNoteSpec(value: ScopeNoteSpec | ReactNode): value is ScopeNoteSpec {
  return (
    typeof value === 'object' &&
    value !== null &&
    !isValidElement(value) &&
    !(Symbol.iterator in value) &&
    !('then' in value)
  );
}

/** Accepts a `scope` host prop — a spec object or a ready node. */
export function renderScopeNote(
  spec?: ScopeNoteSpec | ReactNode,
  extra: Partial<ScopeNoteSpec> = {},
): ReactNode {
  if (spec === undefined || spec === null || spec === false || spec === '') {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (!isScopeNoteSpec(spec)) {
    return null;
  }
  return <ScopeNote {...spec} {...extra} />;
}
