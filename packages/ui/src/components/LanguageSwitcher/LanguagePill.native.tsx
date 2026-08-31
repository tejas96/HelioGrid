import { theme } from '@heliogrid/theme';
import { Text as RNText, StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { LanguageStateGlyph } from './LanguageStateGlyph.native';
import type { AgentLanguage } from './LanguageSwitcher.types';
import { spokenName, stateOf } from './language-state';

const PILL = 34;

const styles = StyleSheet.create({
  /* The 44dp target wraps the 34dp pill, so six languages stay dense with nothing under the floor. */
  target: { minHeight: 44, minWidth: 44 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: PILL,
    paddingHorizontal: 13,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
  pillActive: { backgroundColor: theme.colors.accent, shadowOpacity: 0, elevation: 0 },
  label: {
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.roles['body-sm'].fontSize,
    fontWeight: '500',
    color: theme.colors['text-secondary'],
  },
  onAccent: { color: theme.colors['text-inverse'] },
  fraction: {
    fontFamily: theme.type.families.mono,
    fontSize: theme.type.roles.caption.fontSize,
    color: theme.colors['text-secondary'],
  },
});

export interface LanguagePillProps {
  lang: AgentLanguage;
  active: boolean;
  total: number | null;
  sectionNoun: string;
  fallbackName: string;
  showCounts: boolean;
  onPress: (code: string) => void;
}

/** One language: the NAME, a per-state GLYPH and a FRACTION — none of the three is a colour. */
export function LanguagePill({
  lang,
  active,
  total,
  sectionNoun,
  fallbackName,
  showCounts,
  onPress,
}: LanguagePillProps) {
  const fraction =
    showCounts && total !== null && lang.written !== undefined ? `${lang.written}/${total}` : null;
  return (
    <Pressable
      accessibilityLabel={spokenName(lang, total, sectionNoun, fallbackName, fraction !== null)}
      /* ONE-OF-N BY CONSTRUCTION, so each language is a `tab` inside the strip's `tablist` — the
         same two roles the web half spells. */
      accessibilityRole="tab"
      /* WHICH LANGUAGE IS CHOSEN, said rather than tinted (F7-12): the accent pill is the sighted
         channel and `selected` is the spoken one. `aria-selected` on the web. */
      accessibilityState={{ selected: active }}
      onPress={() => onPress(lang.code)}
      style={styles.target}
    >
      <View style={[styles.pill, active ? styles.pillActive : undefined]}>
        <LanguageStateGlyph state={stateOf(lang, total)} active={active} />
        <RNText style={[styles.label, active ? styles.onAccent : undefined]}>{lang.label}</RNText>
        {lang.primary === true ? (
          <Text variant="caption" color={active ? 'inverse' : 'tertiary'}>
            primary
          </Text>
        ) : null}
        {fraction === null ? null : (
          <RNText style={[styles.fraction, active ? styles.onAccent : undefined]}>
            {fraction}
          </RNText>
        )}
      </View>
    </Pressable>
  );
}
