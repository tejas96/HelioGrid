import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable/Pressable.types';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { SettingsSection, SettingsSectionRow } from '../SettingsSection/SettingsSection.native';
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

/** The three icons on `SegmentedControl`'s track across their holder's width; each is named by its word, which a reader hears. */
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
 * One round button: the choice in force as its icon, each press the next choice. It is named by the
 * switch's label, and the choice's word is said after it.
 */
function AppearanceStep({ words, value, onChange }: Omit<AppearanceSwitchProps, 'form'>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={words.label}
      accessibilityHint={words.options[value]}
      onPress={() => onChange(nextAppearance(value))}
      style={[styles.icon, styles.step]}
    >
      <ShellGlyph name={APPEARANCE_GLYPH[value]} size="md" tone="secondary" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['rf-sm'],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  step: {
    alignSelf: 'center',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['canvas-sunken'],
  },
});
