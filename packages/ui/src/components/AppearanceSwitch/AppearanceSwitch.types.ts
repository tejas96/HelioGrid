import type { TranslatedText } from '@heliogrid/contracts';
import type { Appearance } from '@heliogrid/domain';

/** Every word the switch draws, already translated: `@heliogrid/i18n`'s `appearanceWords`. */
export interface AppearanceWords {
  readonly title: TranslatedText;
  readonly label: TranslatedText;
  /** One quiet line: the choice is kept on this device. */
  readonly caption: TranslatedText;
  readonly options: Readonly<Record<Appearance, TranslatedText>>;
}

/**
 * Profile & preferences' appearance: Device, Light or Dark, applied as it is touched and kept on
 * this device — no account write, so it works signed out and offline.
 */
export interface AppearanceSwitchProps {
  readonly words: AppearanceWords;
  readonly value: Appearance;
  readonly onChange: (next: Appearance) => void;
}
