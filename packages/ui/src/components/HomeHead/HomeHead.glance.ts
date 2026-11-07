import type { TranslatedText } from '@heliogrid/contracts';
import type { SettingsRow } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type { GlanceFact } from '../GlanceStrip/GlanceStrip.types';

/** Home's glance facts, each read where its own page reads it (`HomeGlance` in `@heliogrid/data`). */
export interface HomeGlanceFacts {
  readonly trialDaysLeft: number | null;
  readonly catalogItems: number | null;
  readonly people: number | null;
  readonly voice: { readonly used: number; readonly included: number | null } | null;
}

/** The glance's words — `@heliogrid/i18n`'s `homeGlanceWords`. */
export interface HomeGlanceWords {
  readonly trial: TranslatedText;
  readonly daysLeft: (days: number) => TranslatedText;
  readonly catalog: TranslatedText;
  readonly items: (count: number) => TranslatedText;
  readonly team: TranslatedText;
  readonly people: (count: number) => TranslatedText;
  readonly voice: TranslatedText;
  readonly ofCap: (cap: string) => TranslatedText;
  readonly used: TranslatedText;
  readonly goTo: (label: TranslatedText, value: string, unit: TranslatedText) => TranslatedText;
}

/**
 * Home's small facts for `GlanceStrip`, in a fixed order, each a target that opens the page that
 * keeps it; a fact still out or not this person's is left out, never drawn as a zero.
 */
export function homeGlanceFacts(
  glance: HomeGlanceFacts,
  words: HomeGlanceWords,
  format: Pick<MarketFormat, 'number'>,
  open: (row: SettingsRow) => void,
): GlanceFact[] {
  const facts: GlanceFact[] = [];
  const add = (
    key: string,
    row: SettingsRow,
    label: TranslatedText,
    value: number,
    unit: TranslatedText,
    icon: GlanceFact['icon'],
  ) => {
    const shown = format.number(value);
    facts.push({
      key,
      label,
      value: shown,
      unit,
      icon,
      onPress: () => open(row),
      spokenName: words.goTo(label, shown, unit),
    });
  };
  const { trialDaysLeft, catalogItems, people, voice } = glance;
  if (trialDaysLeft !== null)
    add('trial', 'billing', words.trial, trialDaysLeft, words.daysLeft(trialDaysLeft), 'clock');
  if (catalogItems !== null)
    add('catalog', 'catalog', words.catalog, catalogItems, words.items(catalogItems), 'package');
  if (people !== null) add('team', 'team', words.team, people, words.people(people), 'people');
  if (voice !== null) {
    const unit = voice.included === null ? words.used : words.ofCap(format.number(voice.included));
    add('voice', 'usage', words.voice, voice.used, unit, 'headset');
  }
  return facts;
}
