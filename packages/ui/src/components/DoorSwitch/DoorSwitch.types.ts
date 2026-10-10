/** Every word the switch decision draws; `@heliogrid/i18n`'s `doorSwitchWords` writes them. */
export interface DoorSwitchWords {
  /** Who is signing in, and how much held work the switch discards. */
  title: string;
  /** When the work was taken, and that the switch cannot be undone. */
  subtitle: string;
  upload: string;
  /** Why the upload road cannot be taken yet. */
  uploadReason: string;
  confirm: string;
  /** The sheet's close label. The web half is a panel and reads none. */
  close: string;
}

/**
 * The one deliberately unrecoverable act in the product (`F4-37`, the carve-out from `F4-21`;
 * `SCR-M01-01` `m-switch-discards`): what will be lost is named BEFORE the switch, upload is
 * offered first, and the words say it cannot be undone. The web half is a panel that stands in the
 * number step's form; the native half is a sheet over the step that cannot be dismissed into
 * silence.
 */
export interface DoorSwitchProps {
  words: DoorSwitchWords;
  onConfirm: () => void;
}
