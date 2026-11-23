import type { FileChooserProps } from './FileChooser.types';

/**
 * The phone has no part of its own here: its design studio is the web's, in a web view, whose file
 * input opens the system's sheet (`T-M05-002d`). A native screen that needs a file uses `Dropzone`.
 */
export function FileChooser(_props: FileChooserProps) {
  return null;
}
