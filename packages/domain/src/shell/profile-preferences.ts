import type { SessionUser } from '../auth/session';
import type { RolePreset } from '../authz/roles';
import { UI_LANGUAGES, type UiLanguage } from '../format/languages';
import type { MeasurementSystem } from '../format/pack';

/**
 * Where a preference's value comes from, as its line under the control says (`F7-11`):
 * `inherited` while it still equals the default it started from, `own` once the person moved it.
 * No column records "chosen", so equality with the default is the whole test.
 */
export type PreferenceSource = 'inherited' | 'own';

export interface ProfilePreferencesFacts {
  readonly user: SessionUser;
  /** The device's first language where the set holds it (`useI18n().device`), else null. */
  readonly device: UiLanguage | null;
  /** The market's default measurement system (`pack.measurementSystem`, `F1-21`). */
  readonly marketUnits: MeasurementSystem;
}

/** Profile & preferences (`SCR-M01-11`) as both platforms render it. */
export interface ProfilePreferencesView {
  /** Every preset the person holds, each a badge, never a count or a cut. */
  readonly roles: readonly RolePreset[];
  readonly language: {
    readonly value: UiLanguage;
    readonly options: readonly UiLanguage[];
    readonly source: PreferenceSource;
  };
  readonly units: { readonly value: MeasurementSystem; readonly source: PreferenceSource };
}

export function profilePreferencesView(facts: ProfilePreferencesFacts): ProfilePreferencesView {
  const { user, device, marketUnits } = facts;
  return {
    roles: user.tenant?.roles ?? [],
    language: {
      value: user.interfaceLanguage,
      options: UI_LANGUAGES,
      source: user.interfaceLanguage === device ? 'inherited' : 'own',
    },
    units: {
      value: user.unitPreference,
      source: user.unitPreference === marketUnits ? 'inherited' : 'own',
    },
  };
}
