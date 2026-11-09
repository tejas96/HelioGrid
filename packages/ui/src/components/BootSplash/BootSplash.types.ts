import type { TranslatedText } from '@heliogrid/contracts';

/**
 * The wait while a session resolves, before any screen can be drawn: the wordmark, and under it a
 * thin line a segment of the logo gradient travels until the wait ends. It shows only once the wait outlasts the
 * skeleton delay, so a quick answer never flashes it.
 */
export interface BootSplashProps {
  /** What a screen reader says while it waits — *Opening HelioGrid*. */
  label: TranslatedText;
}
