import { theme } from '@heliogrid/theme';
import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Chip } from '../Chip/Chip.native';
import type { CatalogStrip as CatalogStripSpec } from './CatalogItems.types';

export interface CatalogStripProps {
  strip: CatalogStripSpec;
  /** Where the reader's focus lands when the panel comes back after *Try again*: the text block. */
  focusRef?: RefObject<View | null>;
}

/**
 * The versioning strip that opens a panel: a dot that says whether anything is in force, the
 * title with its tag, the detail line with the way into the past list, and the panel's act.
 * The words are the caller's; a strip with nothing to list is not a button.
 */
export function CatalogStripBar({ strip, focusRef }: CatalogStripProps) {
  const words = (
    <>
      <View style={styles.titleRow}>
        <Text variant="body-sm" bold>
          {strip.title}
        </Text>
        <Tag strip={strip} />
      </View>
      <View style={styles.detailRow}>
        <Text variant="caption" color="secondary">
          {strip.detail}
        </Text>
        {/* The dot travels with the link, so a wrap never leaves it alone on a line. */}
        {strip.link === null ? null : (
          <View style={styles.link}>
            <Text variant="caption" color="secondary">
              {'· '}
            </Text>
            <Text variant="caption" color="secondary" bold>
              {strip.link}
            </Text>
            <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
          </View>
        )}
      </View>
    </>
  );
  return (
    <View style={[tileSurface, styles.strip]}>
      <GroundProvider ground="tile">
        <View
          style={[styles.dot, strip.tag === null ? styles.dotNone : styles.dotLive]}
          importantForAccessibility="no-hide-descendants"
        />
        {/* Focus returns after a retry to the text block: the button when there is a past list,
            else the words alone — never a wrapper around a control. */}
        {strip.link === null ? (
          <View ref={focusRef} accessible style={styles.words}>
            {words}
          </View>
        ) : (
          <Pressable hostRef={focusRef} onPress={strip.onLink} style={styles.press}>
            {words}
          </Pressable>
        )}
        {strip.action === null ? null : (
          <Button variant="secondary" size="sm" onClick={strip.onAction}>
            {strip.action}
          </Button>
        )}
      </GroundProvider>
    </View>
  );
}

/** *r2026-08* in the mono face, or *V7* as a chip; nothing before the first. */
function Tag({ strip }: CatalogStripProps) {
  if (strip.tag === null) return null;
  if (strip.tagAs === 'chip') {
    return <Chip density="functional">{strip.tag}</Chip>;
  }
  return (
    <Text variant="mono" bold>
      {strip.tag}
    </Text>
  );
}

const DOT = theme.spacing['sp-2'];

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
  },
  dot: { width: DOT, height: DOT, borderRadius: theme.radius['r-pill'] },
  dotLive: { backgroundColor: theme.colors.success },
  dotNone: { backgroundColor: theme.colors['mark-subtle'] },
  /* The whole text block is the way into the past list; the press keeps the 44 floor. */
  press: { flex: 1, minWidth: 0, alignItems: 'stretch', justifyContent: 'center' },
  words: { flex: 1, minWidth: 0, justifyContent: 'center' },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing['sp-1'],
  },
  link: { flexDirection: 'row', alignItems: 'center' },
});
