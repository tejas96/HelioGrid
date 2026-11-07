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
 * The appearance: Device, Light or Dark, as three icons — a monitor, a sun, a moon — each named and,
 * on the web, tipped with its word. Applied as it is touched and kept on this device — no account
 * write, so it works signed out and offline.
 */
export interface AppearanceSwitchProps {
  readonly words: AppearanceWords;
  readonly value: Appearance;
  readonly onChange: (next: Appearance) => void;
  /**
   * `section` (the default): Profile & preferences' row, its title, label and caption beside the
   * icons. `icons`: the three icons alone, named by `words.label` — the sidebar's account block.
   */
  readonly form?: 'section' | 'icons';
}
