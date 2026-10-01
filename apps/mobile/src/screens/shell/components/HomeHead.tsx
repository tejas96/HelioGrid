import type { RolePreset } from '@heliogrid/domain';
import { homeTitle, presetLine, presetName, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Menu, Pressable, ShellGlyph, Text } from '@heliogrid/ui';
import type { RefObject } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { styles, switcherWidth } from '../styles';

interface HomeHeadProps {
  home: RolePreset;
  /** Every held preset's home, in ladder order (`M13-10`). One entry still opens the switcher. */
  homes: readonly RolePreset[];
  onChoose: (preset: RolePreset) => void;
  titleRef: RefObject<View | null>;
}

/**
 * The home's title, which IS the switcher (`SCR-SHELL-01` decision 4): each entry the home's
 * title with its preset beside it, since two presets share "My Day" and two "Owner Dashboard";
 * the one in force ticked. Under it, whose home this is.
 */
export function HomeHead({ home, homes, onChoose, titleRef }: HomeHeadProps) {
  const t = useTranslate();
  const { width } = useWindowDimensions();
  return (
    <View style={styles.head}>
      <View ref={titleRef} collapsable={false} style={styles.titleAnchor}>
        <Menu
          label={t(SHELL.switchHome)}
          align="start"
          selection="single"
          width={switcherWidth(width)}
          trigger={
            <TitleTrigger
              title={homeTitle(t, home)}
              name={t(SHELL.switchFrom, { home: homeTitle(t, home) })}
            />
          }
          items={homes.map((preset) => ({
            key: preset,
            label: homeTitle(t, preset),
            meta: presetName(t, preset),
            selected: preset === home,
            onSelect: () => onChoose(preset),
          }))}
        />
      </View>
      <Text variant="caption" color="secondary">
        {presetLine(t, home, homes)}
      </Text>
    </View>
  );
}

interface TitleTriggerProps {
  title: string;
  /** The trigger's name: the title, and that it switches. */
  name: string;
  /** Set by `Menu` when it clones its trigger. */
  onClick?: () => void;
}

function TitleTrigger({ title, name, onClick }: TitleTriggerProps) {
  return (
    <Pressable accessibilityLabel={name} onPress={onClick}>
      <View style={styles.titleTrigger}>
        <Text variant="h3">{title}</Text>
        <ShellGlyph name="chevron" size="md" tone="primary" />
      </View>
    </Pressable>
  );
}
