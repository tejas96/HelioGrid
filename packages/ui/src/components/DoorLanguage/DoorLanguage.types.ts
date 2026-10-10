import type { UiLanguage } from '@heliogrid/domain';

/**
 * The door's language control (`SCR-M01-01` decision 5): one ghost control that reads the mount's
 * language under its own name and opens the set, so a shared desk or field phone switches before
 * anyone signs in. `@heliogrid/i18n/react`'s `useLanguageChoice` hands out exactly these props.
 */
export interface DoorLanguageProps {
  /** The menu's accessible name. */
  label: string;
  current: UiLanguage;
  /** Each language's own name; the set and its order are `domain`'s. */
  names: Readonly<Record<UiLanguage, string>>;
  onChoose: (language: UiLanguage) => void;
}
