import { appearanceOf } from '@heliogrid/domain';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { SettingsSection, SettingsSectionRow } from '../SettingsSection/SettingsSection';
import { appearanceOptions } from './AppearanceSwitch.logic';
import type { AppearanceSwitchProps } from './AppearanceSwitch.types';

export function AppearanceSwitch({ words, value, onChange }: AppearanceSwitchProps) {
  return (
    <SettingsSection title={words.title}>
      <SettingsSectionRow
        label={words.label}
        caption={words.caption}
        control={
          <SegmentedControl
            ariaLabel={words.label}
            value={value}
            options={appearanceOptions(words)}
            onChange={(next) => {
              const chosen = appearanceOf(next);
              if (chosen !== null) onChange(chosen);
            }}
          />
        }
      />
    </SettingsSection>
  );
}
