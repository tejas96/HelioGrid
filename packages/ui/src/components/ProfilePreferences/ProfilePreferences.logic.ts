import {
  MEASUREMENT_SYSTEMS,
  type MeasurementSystem,
  roleKind,
  UI_LANGUAGES,
  type UiLanguage,
} from '@heliogrid/domain';
import { ROLE_KIND_TONE } from '../Chip/Chip.logic';
import type { ProfilePreferencesWords } from './ProfilePreferences.types';

/** The web page's own room from which it draws the desktop's cards; below it, the phone's page. */
export const PROFILE_PREFERENCES_WIDE_FROM = 640;

/** A role badge's tone is its kind's iris hue, as on Team. */
export function roleBadges(words: ProfilePreferencesWords) {
  return words.roles.badges.map((badge) => ({
    ...badge,
    tone: ROLE_KIND_TONE[roleKind(badge.preset)],
  }));
}

export function unitOptions(words: ProfilePreferencesWords) {
  return MEASUREMENT_SYSTEMS.map((value) => ({ value, label: words.units[value] }));
}

/** A control's value back as the type it was given — the controls speak plain strings. */
export function languageOf(value: string): UiLanguage | null {
  return UI_LANGUAGES.find((language) => language === value) ?? null;
}

export function unitsOf(value: string): MeasurementSystem | null {
  return MEASUREMENT_SYSTEMS.find((system) => system === value) ?? null;
}
