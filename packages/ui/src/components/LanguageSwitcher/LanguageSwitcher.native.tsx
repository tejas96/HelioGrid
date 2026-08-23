import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { LanguagePill } from './LanguagePill.native';
import type { AgentLanguage, LanguageSwitcherProps } from './LanguageSwitcher.types';
import { selectedSentence, summaryLine, totalOf } from './language-state';

interface NativeLanguageSwitcherProps extends LanguageSwitcherProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  wrap: { minWidth: 0 },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: theme.spacing['sp-2'],
    marginBottom: theme.spacing['sp-1'],
  },
  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
  },
  stripRow: { flexWrap: 'nowrap' },
  sentence: { marginTop: theme.spacing['sp-2'], marginHorizontal: theme.spacing['sp-0-5'] },
});

/**
 * Same three channels and the same sentence as the web half. One platform mapping: web is
 * `role="tablist"` with a roving tabindex and arrow keys that select as they move; touch has no
 * arrow keys, so the strip is a row of pressable pills. Functional density SCROLLS the strip rather
 * than shrinking any target.
 */
export function LanguageSwitcher({
  languages = [],
  value,
  onChange,
  sections,
  sectionNoun = 'sections',
  label = 'Agent language',
  summary,
  showCounts = true,
  density = 'expressive',
  style,
}: NativeLanguageSwitcherProps) {
  const primary = languages.find((l) => l.primary === true) ?? languages[0];
  const idx = Math.max(
    0,
    languages.findIndex((l) => l.code === value),
  );
  const total = totalOf(languages, sections);
  const fallbackName = primary?.label ?? '';

  const pill = (lang: AgentLanguage) => (
    <LanguagePill
      key={lang.code}
      lang={lang}
      active={lang.code === value}
      total={total}
      sectionNoun={sectionNoun}
      fallbackName={fallbackName}
      showCounts={showCounts}
      onPress={(code) => onChange?.(code)}
    />
  );

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.head}>
        {label === undefined ? null : (
          <Text variant="overline" color="tertiary">
            {label}
          </Text>
        )}
        <Text variant="caption" color="tertiary">
          {summary ?? summaryLine(languages, total, sectionNoun)}
        </Text>
      </View>

      {/* THE STRIP IS A TABLIST, on both halves. A role — not `accessible`, which would fold the six
          pills into one element and put every language out of reach. The pills stay their own
          targets; the strip only says what the set IS, so "one of six, this one" is announced
          rather than left to the accent tint (F7-12). */}
      {density === 'functional' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View
            accessibilityRole="tablist"
            accessibilityLabel={label}
            style={[styles.strip, styles.stripRow]}
          >
            {languages.map(pill)}
          </View>
        </ScrollView>
      ) : (
        <View accessibilityRole="tablist" accessibilityLabel={label} style={styles.strip}>
          {languages.map(pill)}
        </View>
      )}

      <View accessibilityLiveRegion="polite" style={styles.sentence}>
        <Text variant="caption" color="secondary">
          {selectedSentence(languages[idx], total, sectionNoun, fallbackName)}
        </Text>
      </View>
    </View>
  );
}
