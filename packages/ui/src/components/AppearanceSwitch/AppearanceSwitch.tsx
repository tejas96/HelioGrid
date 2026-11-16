import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { SettingsSection, SettingsSectionRow } from '../SettingsSection/SettingsSection';
import {
  APPEARANCE_GLYPH,
  appearanceOf,
  appearanceOptions,
  nextAppearance,
} from './AppearanceSwitch.logic';
import type { AppearanceSwitchProps } from './AppearanceSwitch.types';

export function AppearanceSwitch({
  words,
  value,
  onChange,
  form = 'section',
}: AppearanceSwitchProps) {
  if (form === 'step') return <AppearanceStep words={words} value={value} onChange={onChange} />;
  const icons = <AppearanceIcons words={words} value={value} onChange={onChange} />;
  if (form === 'icons') return icons;
  return (
    <SettingsSection title={words.title}>
      <SettingsSectionRow label={words.label} caption={words.caption} control={icons} />
    </SettingsSection>
  );
}

/** The three icons on `SegmentedControl`'s track across their holder's width: the chosen one its raised thumb, each named and tipped with its word. */
function AppearanceIcons({ words, value, onChange }: Omit<AppearanceSwitchProps, 'form'>) {
  return (
    <SegmentedControl
      iconOnly
      fill
      ariaLabel={words.label}
      options={appearanceOptions(words)}
      value={value}
      onChange={(next) => onChange(appearanceOf(next))}
    />
  );
}

/**
 * One round button: the choice in force as its icon and its tip, each press the next choice. It is
 * named by the switch's label, and the choice's word is said after it.
 */
function AppearanceStep({ words, value, onChange }: Omit<AppearanceSwitchProps, 'form'>) {
  return (
    <span className="hg-appearance-step hg-tip" data-tip={words.options[value]} data-tip-side="end">
      <Pressable
        accessibilityLabel={words.label}
        accessibilityHint={words.options[value]}
        onPress={() => onChange(nextAppearance(value))}
        className="hg-appearance-icon"
      >
        <ShellGlyph name={APPEARANCE_GLYPH[value]} size="md" tone="secondary" />
      </Pressable>
    </span>
  );
}
