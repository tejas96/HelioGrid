import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';

export function CameraGlyph() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ShellGlyphMarks name="camera" />
    </svg>
  );
}

export function FileGlyph() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ShellGlyphMarks name="file" />
    </svg>
  );
}

/** The upload's progress channel — beside the label, never in place of it. */
export function DropzoneSpinner() {
  return <span className="hg-dropzone-spinner" aria-hidden="true" />;
}
