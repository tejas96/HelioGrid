import type { SessionUser } from '../auth/session';
import type { RolePreset } from '../authz/roles';
import { UI_LANGUAGES, type UiLanguage } from '../format/languages';
import type { MeasurementSystem } from '../format/pack';
import { pushGroupsShownTo } from '../notifications/mutes';
import type { NotificationTypeGroup } from '../notifications/types';

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

/**
 * One push group as the api answers it (`F6-15`). The group is open: an app older than the api may
 * meet a group it does not know, and draws no switch for it.
 */
export interface PushPreference {
  readonly group: string;
  readonly pushMuted: boolean;
  readonly mutable: boolean;
}

/** One switch on the page: on while push is on (brief decision 3); locked where it may not move. */
export interface PushSwitch {
  readonly group: NotificationTypeGroup;
  readonly on: boolean;
  readonly locked: boolean;
}

/**
 * The push section's switches, in the registry's order, one per group this person is shown
 * (`pushGroupsShownTo`). A locked group is always sent, so its switch reads on.
 */
export function pushSwitches(
  preferences: readonly PushPreference[],
  presets: readonly RolePreset[],
): readonly PushSwitch[] {
  return pushGroupsShownTo(presets).flatMap((group) => {
    const stored = preferences.find((row) => row.group === group);
    if (stored === undefined) return [];
    return [{ group, on: !stored.mutable || !stored.pushMuted, locked: !stored.mutable }];
  });
}
