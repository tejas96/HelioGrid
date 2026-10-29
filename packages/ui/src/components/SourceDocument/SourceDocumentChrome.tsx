/* SourceDocument's chrome (web): the paging/fit controls, the state panel, and the act that opens
   the real file.

   The fit controls (fit width / fit whole page) say which one is in force, and they say it through
   the primitive: `accessibilityState.selected` is `aria-pressed` here and
   `accessibilityState.selected` on the native half, one declaration for both, with the 44×44 floor
   and the focus ring coming from `hg-pressable` rather than a second copy of the numbers. */

import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { Pressable } from '../../primitives/Pressable';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { Button } from '../Button/Button';
import { messageGlyphOf } from './SourceDocument.logic';

export function Chrome({ children }: { children: ReactNode }) {
  return <span className="hg-source-doc-chrome">{children}</span>;
}

export function IconBtn({
  label,
  glyph,
  onClick,
  disabled,
  pressed,
}: {
  label: TranslatedText;
  glyph: ShellGlyphName;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <Pressable
      className="hg-source-doc-icon-btn"
      accessibilityLabel={label}
      accessibilityState={{ selected: pressed }}
      disabled={disabled}
      onPress={onClick}
    >
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
        <ShellGlyphMarks name={glyph} />
      </svg>
    </Pressable>
  );
}

/**
 * A preview is never the only way to see a file, so this is a LINK when there is a URL — new tab,
 * copy-link and middle-click keep working, which a `Button` cannot give. It wears `Button`'s own
 * secondary `md` rule, so no copy of the pill exists.
 */
export function OpenOriginal({
  children,
  onClick,
  href,
}: {
  children: TranslatedText;
  onClick?: () => void;
  href?: string;
}) {
  if (href) {
    return (
      <a
        className="hg-button"
        data-variant="secondary"
        data-size="md"
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <Button variant="secondary" size="md" onClick={onClick}>
      {children}
    </Button>
  );
}

export function Message({
  tone,
  title,
  message,
  action,
}: {
  tone?: 'warning';
  title: TranslatedText;
  message?: TranslatedText;
  action?: ReactNode;
}) {
  return (
    <div className="hg-source-doc-message" data-tone={tone ?? 'neutral'}>
      <span className="hg-source-doc-message-mark">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ShellGlyphMarks name={messageGlyphOf(tone)} />
        </svg>
      </span>
      <span className="hg-source-doc-message-title">{title}</span>
      {/* --text-tertiary measures 4.478:1 on --canvas-sunken, under the 4.5 floor: this panel is a
          THIRD background, so 12px words on it take --text-secondary. */}
      {message ? <span className="hg-source-doc-message-body">{message}</span> : null}
      {action}
    </div>
  );
}
