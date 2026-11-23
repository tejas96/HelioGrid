import type { TranslatedText } from '@heliogrid/contracts';
import type { Ref } from 'react';

/** Opens the system's file picker. */
export interface FileChooserHandle {
  open(): void;
}

/**
 * The system's own file picker with no button of its own (`T-M05-002d`): a menu row or an act opens
 * it through its handle. The phone's sheet and the desktop's window are the system's; the files
 * `accept` names are offered, the others stay grey.
 */
export interface FileChooserProps {
  /** File ends and types offered, as the platform's picker reads them: `.dwg`, `image/jpeg`. */
  accept: readonly string[];
  /** What a screen reader says the picker is for. */
  label: TranslatedText;
  /** The file picked; the same file picked again is a new pick. */
  onPick: (file: File) => void;
  handle: Ref<FileChooserHandle>;
}
