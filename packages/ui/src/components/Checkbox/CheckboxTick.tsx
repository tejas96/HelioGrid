import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';

/** The tick a checked box draws, in the ink around it — `Checkbox`'s, and a multi-select card's. */
export function CheckboxTick() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ShellGlyphMarks name="tick-small" />
    </svg>
  );
}
