import { ShellGlyphMarks } from '../../components/AppShell/ShellGlyphMarks';
import type { AttentionGlyphProps } from './AttentionGlyph.types';

/**
 * The attention mark — an upright stroke over a dot. Drawn here because every glyph is drawn in
 * this package, never taken from an icon package.
 */
export function AttentionGlyph(props: AttentionGlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <ShellGlyphMarks name="attention" />
    </svg>
  );
}
