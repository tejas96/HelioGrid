import { ShellGlyph } from '../AppShell/ShellGlyph';

export function CameraGlyph() {
  return <ShellGlyph name="camera" size="xl" tone="current" />;
}

export function FileGlyph() {
  return <ShellGlyph name="file" size="lg" tone="current" />;
}

/** The upload's progress channel — beside the label, never in place of it. */
export function DropzoneSpinner() {
  return <span className="hg-dropzone-spinner" aria-hidden="true" />;
}
