import { theme } from '@heliogrid/theme';
import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Chip } from '../Chip/Chip.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { LottieMoment } from '../LottieMoment/LottieMoment.native';
import type { CatalogStrip as CatalogStripSpec } from './CatalogItems.types';
import { useJustPublished } from './use-just-published';

export interface CatalogStripProps {
  strip: CatalogStripSpec;
  /** Where the reader's focus lands when the panel comes back after *Try again*: the hero's words. */
  focusRef?: RefObject<View | null>;
}

/**
 * The panel's one hero: what is in force, its tag large, a dot that says whether anything is live,
 * the line under it, the way into the past list and the panel's act. The words are the caller's.
 */
export function CatalogStripBar({ strip, focusRef }: CatalogStripProps) {
  const published = useJustPublished(strip.tag);
  return (
    <HeroPanel
      label={strip.title}
      labelAside={
        <View
          style={[styles.dot, strip.tag === null ? styles.dotNone : styles.dotLive]}
          importantForAccessibility="no-hide-descendants"
        />
      }
    >
      <View ref={focusRef} accessible style={styles.words}>
        {published ? <LottieMoment name="celebrate" size={48} /> : null}
        <Tag strip={strip} />
        <Text variant="body" color="secondary">
          {strip.detail}
        </Text>
      </View>
      {strip.link === null && strip.action === null ? null : (
        <View style={styles.acts}>
          {strip.action === null ? null : (
            <Button variant="primary" size="md" onClick={strip.onAction}>
              {strip.action}
            </Button>
          )}
          {strip.link === null ? null : (
            <Button
              variant="ghost"
              size="md"
              onClick={strip.onLink}
              iconRight={<ShellGlyph name="chevron-right" size="sm" tone="secondary" />}
            >
              {strip.link}
            </Button>
          )}
        </View>
      )}
    </HeroPanel>
  );
}

/** *r2026-08* large in the mono face, or *V7* as a chip; nothing before the first. */
function Tag({ strip }: CatalogStripProps) {
  if (strip.tag === null) return null;
  if (strip.tagAs === 'chip') {
    return <Chip density="functional">{strip.tag}</Chip>;
  }
  return (
    <Text variant="mono" style={styles.tag}>
      {strip.tag}
    </Text>
  );
}

const DOT = theme.spacing['sp-2'];

const styles = StyleSheet.create({
  dot: { width: DOT, height: DOT, borderRadius: theme.radius['r-pill'] },
  dotLive: { backgroundColor: colors.success },
  dotNone: { backgroundColor: colors['mark-subtle'] },
  words: { gap: theme.spacing['sp-1'], alignItems: 'flex-start' },
  tag: {
    fontSize: theme.type.roles.h2.fontSize,
    lineHeight: theme.type.roles.h2.lineHeight,
    fontWeight: '500',
    color: colors['on-panel'],
  },
  acts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});
