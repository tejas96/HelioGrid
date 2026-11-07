import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { SettingsSection, SettingsSectionRow } from '../SettingsSection/SettingsSection';
import { appearanceOptions } from './AppearanceSwitch.logic';
import type { AppearanceSwitchProps } from './AppearanceSwitch.types';

export function AppearanceSwitch({
  words,
  value,
  onChange,
  form = 'section',
}: AppearanceSwitchProps) {
  const icons = <AppearanceIcons words={words} value={value} onChange={onChange} />;
  if (form === 'icons') return icons;
  return (
    <SettingsSection title={words.title}>
      <SettingsSectionRow label={words.label} caption={words.caption} control={icons} />
    </SettingsSection>
  );
}

/** The three icons on one track: the chosen one raised on it, each named and tipped with its word. */
function AppearanceIcons({ words, value, onChange }: Omit<AppearanceSwitchProps, 'form'>) {
  return (
    <fieldset aria-label={words.label} className="hg-appearance-icons">
      {appearanceOptions(words).map((option) => {
        const chosen = option.value === value;
        return (
          <span key={option.value} className="hg-appearance-tip" data-tip={option.label}>
            <Pressable
              accessibilityLabel={option.label}
              accessibilityState={{ selected: chosen }}
              onPress={() => onChange(option.value)}
              className={classNames('hg-appearance-icon')}
            >
              <ShellGlyph name={option.glyph} size="md" tone={chosen ? 'primary' : 'secondary'} />
            </Pressable>
          </span>
        );
      })}
    </fieldset>
  );
}
