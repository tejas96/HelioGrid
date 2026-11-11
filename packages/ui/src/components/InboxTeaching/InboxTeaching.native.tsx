import { theme } from '@heliogrid/theme';
import { useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { CardRow, CardRows } from '../CardRows/CardRows.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { sourceGlyphOf } from '../LeadSourceMark/LeadSourceMark.logic';
import type { InboxTeachingProps } from './InboxTeaching.types';

/**
 * The teaching inbox on the phone (`M02-25`): the hero says what will wait here and offers
 * *Add a lead*; under it, each way a lead arrives opens that way.
 */
export function InboxTeaching({ onAdd, onWay, ways, words, headingRef }: InboxTeachingProps) {
  const heading = useRef<View>(null);
  useImperativeHandle(headingRef, () => ({
    focus: () => focusScreenReaderOn(() => heading.current),
  }));
  return (
    <View style={styles.teaching}>
      <HeroPanel name={words.title}>
        <View style={styles.head}>
          <View style={styles.ring} importantForAccessibility="no-hide-descendants">
            <ShellGlyph name="layers" size="md" tone="accent" />
          </View>
          <View ref={heading} style={styles.title} accessible accessibilityRole="header">
            <Text variant="h1" style={styles.ink}>
              {words.title}
            </Text>
          </View>
        </View>
        <Text variant="body" style={styles.muted}>
          {words.body}
        </Text>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
          onClick={onAdd}
        >
          {words.add}
        </Button>
      </HeroPanel>
      <View accessible accessibilityRole="header" style={styles.over}>
        <Text variant="overline" color="secondary">
          {words.waysTitle}
        </Text>
      </View>
      <CardRows form="joined">
        {ways.map((way, index) => (
          <CardRow
            key={way}
            first={index === 0}
            open={{ name: words.ways[way].title, onOpen: () => onWay(way) }}
          >
            <View style={styles.way}>
              <View style={styles.glyph}>
                <ShellGlyph name={sourceGlyphOf(way)} size="md" tone="accent" />
              </View>
              <View style={styles.words}>
                <Text variant="body" bold>
                  {words.ways[way].title}
                </Text>
                <Text variant="body-sm" color="secondary">
                  {words.ways[way].line}
                </Text>
              </View>
              <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
            </View>
          </CardRow>
        ))}
      </CardRows>
    </View>
  );
}

const styles = StyleSheet.create({
  teaching: { gap: theme.spacing['sp-3'] },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  ring: {
    width: theme.spacing['sp-12'],
    height: theme.spacing['sp-12'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['accent-subtle'],
  },
  title: { flex: 1 },
  ink: { color: colors['on-panel'] },
  muted: { color: colors['on-panel-muted'] },
  over: { marginTop: theme.spacing['sp-3'], paddingHorizontal: theme.spacing['sp-1'] },
  way: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  glyph: {
    width: theme.spacing['sp-10'],
    height: theme.spacing['sp-10'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-md'],
    backgroundColor: colors['accent-subtle'],
  },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
});
