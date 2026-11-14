import type { ProvenanceTier as Tier, TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { HueTile } from '../HueTile/HueTile.native';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import { useProvenanceWords } from '../Provenance/Provenance.words';
import { RollingNumber } from '../RollingNumber/RollingNumber.native';
import { type BlockInk, paperTileTint, useBlockInk } from './block-ink.native';
import { aroundFigure } from './ProposalBlocks.logic';
import type { ProposalBlockMode } from './ProposalBlocks.types';
import type { BlockFigure as Figure } from './ProposalBlocks.views';

const display = theme.type.families.display;
const mono = theme.type.families.mono;

/** The paper's own type sizes — print geometry against the 794 dp page, as the web half's are. */
export const PAPER_TYPE = {
  hero: { fontSize: 64, lineHeight: 68 },
  display: { fontSize: 46, lineHeight: 52 },
  sub: { fontSize: 15, lineHeight: 22 },
} as const;

/** The mono face for a figure set inside a sentence. */
export const MONO: TextStyle = { fontFamily: mono, fontVariant: ['tabular-nums'] };

/**
 * A figure's tier (`F8-01`) in its quietest form. On paper it is the same word in the page's fixed
 * ink, since the label's own colours follow the phone's scheme and a page does not.
 */
export function BlockTier({ mode, tier }: { mode: ProposalBlockMode; tier: Tier }) {
  const ink = useBlockInk(mode);
  const words = useProvenanceWords();
  if (mode !== 'paper') return <ProvenanceTier tier={tier} />;
  return (
    <View style={styles.tier}>
      <View style={[styles.tierDot, { backgroundColor: ink.warningText }]} />
      <Text variant="caption" style={{ color: ink.secondary }}>
        {words.tier(tier)}
      </Text>
    </View>
  );
}

/**
 * A block's head: what the figure under it is, and the honesty of it — a tier, or a verdict. On
 * paper the tier is the same word in the page's fixed ink, since the label's own colours follow
 * the phone's scheme and a page does not.
 */
export function BlockOver({
  mode,
  overline,
  tier,
  aside,
}: {
  mode: ProposalBlockMode;
  overline: TranslatedText;
  tier?: Tier;
  aside?: ReactNode;
}) {
  const ink = useBlockInk(mode);
  return (
    <View style={styles.overRow}>
      <Text variant="overline" style={[styles.over, { color: ink.tertiary }]}>
        {overline}
      </Text>
      {tier === undefined ? null : <BlockTier mode={mode} tier={tier} />}
      {aside}
    </View>
  );
}

/**
 * The block's one large figure. In the builder and on the customer's page it rolls into place once;
 * on paper it stands at the paper's own size, in the page's ink.
 */
export function BlockFigure({
  mode,
  figure,
  size = 'hero',
  color,
}: {
  mode: ProposalBlockMode;
  figure: Figure;
  size?: 'hero' | 'display';
  color?: BlockInk['text'];
}) {
  const ink = useBlockInk(mode);
  if (mode !== 'paper' && color === undefined) {
    return <RollingNumber value={figure.text} variant={size} />;
  }
  return (
    <Text
      variant={size}
      style={[
        { fontFamily: display, color: color ?? ink.text },
        mode === 'paper' ? PAPER_TYPE[size] : undefined,
      ]}
    >
      {figure.text}
    </Text>
  );
}

/** A sentence with its figure set in the mono face, wherever the reader's language put it. */
export function FigureLine({
  sentence,
  figure,
  quiet = false,
  figureColor,
}: {
  sentence: string;
  figure: string;
  /** A check beside the facts, not one of them: the mono face at the line's own weight. */
  quiet?: boolean;
  figureColor?: BlockInk['text'];
}) {
  const cut = aroundFigure(sentence, figure);
  return (
    <>
      {cut.lead}
      {cut.figure === '' ? null : (
        <Text
          variant="mono"
          style={[
            MONO,
            quiet ? undefined : styles.figureBold,
            figureColor === undefined ? undefined : { color: figureColor },
          ]}
        >
          {cut.figure}
        </Text>
      )}
      {cut.trail}
    </>
  );
}

/**
 * A glyph on its tint. The system's `HueTile` in the builder and on the customer's page; on paper
 * the same tile in the light palette's pair, since a page is light in every scheme.
 */
export function BlockTile({
  mode,
  glyph,
  hue,
  size,
}: {
  mode: ProposalBlockMode;
  glyph: ShellGlyphName;
  hue: 'ocean' | 'teal' | 'success' | 'neutral' | 'danger';
  size: 36 | 40 | 44;
}) {
  if (mode !== 'paper') return <HueTile glyph={glyph} hue={hue} size={size} stroke={1.6} />;
  const tint = paperTileTint(hue);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, { width: size, height: size, backgroundColor: tint.bg }]}
    >
      <Svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        stroke={tint.fg}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ShellGlyphMarks name={glyph} />
      </Svg>
    </View>
  );
}

/** A small glyph in a stated colour — a verdict's mark, a source's sun — in any mode's ink. */
export function InkGlyph({ name, color }: { name: ShellGlyphName; color: BlockInk['text'] }) {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ShellGlyphMarks name={name} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  overRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
    minHeight: theme.spacing['sp-5'],
  },
  over: { flexShrink: 1 },
  tier: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  tierDot: { width: 5, height: 5, borderRadius: 5 },
  figureBold: { fontWeight: '500' },
  tile: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-sm'],
  },
});
