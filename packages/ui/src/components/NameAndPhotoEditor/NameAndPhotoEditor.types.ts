import type { FirstRunProfileFrame } from '@heliogrid/domain';
import type { PickedFile } from '../Dropzone/Dropzone.types';

/** Every word the editor draws, already translated: `@heliogrid/i18n`'s `nameAndPhotoEditorWords`. */
export interface NameAndPhotoEditorWords {
  readonly title: string;
  readonly close: string;
  readonly name: {
    readonly label: string;
    readonly error: string | null;
    readonly success: string | null;
  };
  readonly photo: {
    readonly label: string;
    readonly choosePhone: string;
    readonly chooseWide: string;
    readonly replace: string;
    readonly remove: string;
    readonly error: { readonly title: string; readonly line: string } | null;
  };
  readonly act: string;
  readonly saveFailed: { readonly title: string; readonly line: string } | null;
}

/**
 * Profile & preferences' *Edit name* editor (`SCR-M01-11`, ruling 1 at `T-M01-011`): the name and
 * the photo alone (`M01-14`), over the page — a sheet with its handle on the phone, the 480 right
 * panel with its close from the panel width (`F7-21`). First-Run Profile's field and `PhotoField`
 * without its onboarding chrome; one act, *Save*, or *Done* once the photo alone failed. While a
 * save is out only the act is busy: the field and the photo stay as typed and chosen.
 */
export interface NameAndPhotoEditorProps {
  readonly open: boolean;
  readonly words: NameAndPhotoEditorWords;
  readonly frame: FirstRunProfileFrame;
  /** The name in the field. */
  readonly name: string;
  /** The photo drawn in the circle — the saved one or the one just chosen. */
  readonly picture?: string;
  readonly onName: (name: string) => void;
  /** Opens the platform's picker. */
  readonly onChoosePhoto: () => void;
  /** A photo dropped onto the circle — the panel only, on the web. */
  readonly onDropPhoto?: (file: PickedFile) => void;
  readonly onRemovePhoto: () => void;
  /** *Try the photo again*: the photo alone, sent again. */
  readonly onRetryPhoto: () => void;
  /** The one act: *Save*, or *Done*. */
  readonly onSave: () => void;
  /** Leaves without saving. */
  readonly onClose: () => void;
}
