import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable/Pressable.types';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { SettingsSection, SettingsSectionRow } from '../SettingsSection/SettingsSection.native';
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

/**
 * The three icons on one track, the chosen one raised and edged so it shows in dark as in light.
 * Each is named by its word; the phone has no hover, so its name is what a reader hears.
 */
function AppearanceIcons({ words, value, onChange }: Omit<AppearanceSwitchProps, 'form'>) {
  const { controlFill } = useGround();
  return (
    <View accessibilityRole="radiogroup" aria-label={words.label} style={styles.track}>
      {appearanceOptions(words).map((option) => {
        const chosen = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: chosen }}
            onPress={() => onChange(option.value)}
            style={[styles.icon, chosen ? [styles.chosen, { backgroundColor: controlFill }] : null]}
          >
            <ShellGlyph name={option.glyph} size="md" tone={chosen ? 'primary' : 'secondary'} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-0-5'],
    padding: theme.spacing['sp-0-5'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['canvas-sunken'],
  },
  icon: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chosen: {
    borderColor: colors['line-strong'],
    ...theme.elevation.e1,
  },
});
