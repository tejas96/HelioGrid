import { theme } from '@heliogrid/theme';
import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Badge } from '../Chip/Chip.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { LottieMoment } from '../LottieMoment/LottieMoment.native';
import { RollingNumber } from '../RollingNumber/RollingNumber.native';
import type { CatalogStripFigure, CatalogStrip as CatalogStripSpec } from './CatalogItems.types';
import { useJustPublished } from './use-just-published';

export interface CatalogStripProps {
  strip: CatalogStripSpec;
  /** Where the reader's focus lands when the panel comes back after *Try again*: the hero's words. */
  focusRef?: RefObject<View | null>;
}

/**
 * The panel's one hero on the phone (direction A): its title with what is live beside it, the
 * catalog's figures — the first in the hero face — each over its label, the line under them, then
 * the panel's act and the way into the past list. The words are the caller's.
 */
export function CatalogStripBar({ strip, focusRef }: CatalogStripProps) {
  const published = useJustPublished(strip.tag);
  return (
    <HeroPanel label={strip.title} labelAside={<Live strip={strip} />}>
      <View ref={focusRef} accessible style={styles.words}>
        {published ? <LottieMoment name="published" size={72} /> : null}
        <Figures figures={strip.figures} />
        <Text variant="body" color="secondary">
          {strip.detail}
        </Text>
      </View>
      {strip.link === null && strip.action === null ? null : (
        <View style={styles.acts}>
          {strip.action === null ? null : (
            <Button
              variant="primary"
              size="lg"
              onClick={strip.onAction}
              icon={<ShellGlyph name="upload" size="sm" tone="inverse" />}
            >
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

/** What is in force, beside the title: the tag as a badge, or a quiet dot before the first. */
function Live({ strip }: { strip: CatalogStripSpec }) {
  if (strip.tag === null) {
    return <View style={styles.dot} importantForAccessibility="no-hide-descendants" />;
  }
  return (
    <Badge tone={strip.tagAs === 'mono' ? 'success' : 'neutral'} density="functional">
      {strip.tag}
    </Badge>
  );
}

/** The figures: the first in the hero face, the rest in the figure face, each over its label. */
function Figures({ figures }: { figures: readonly CatalogStripFigure[] | undefined }) {
  if (figures === undefined || figures.length === 0) return null;
  return (
    <View style={styles.figures}>
      {figures.map((figure, index) => (
        <View key={figure.label} style={styles.figure} accessible>
          <RollingNumber value={figure.value} variant={index === 0 ? 'hero' : 'figure'} />
          <Text variant="caption" color="secondary">
            {figure.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const DOT = theme.spacing['sp-2'];

const styles = StyleSheet.create({
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['mark-subtle'],
  },
  words: { gap: theme.spacing['sp-2'], alignItems: 'flex-start' },
  figures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    columnGap: theme.spacing['sp-8'],
    rowGap: theme.spacing['sp-3'],
  },
  figure: { gap: theme.spacing['sp-0-5'] },
  acts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});
