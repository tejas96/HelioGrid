import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Rising } from '../../primitives/rising.native';
import { Text } from '../../primitives/Text/Text.native';
import { categoryHueOf, hueTintOf } from '../Avatar/Avatar.logic';
import { BlockTile, InkGlyph } from './BlockParts.native';
import { type BlockInk, paperTileTint, useBlockInk } from './block-ink.native';
import { type PartKindView, partKindViews } from './ProposalBlocks.facts';
import { brandLetter } from './ProposalBlocks.logic';
import type { ProposalPartsWords } from './ProposalBlocks.parts.types';
import type { ProposalBlockMode, ProposalPartsBlockProps } from './ProposalBlocks.types';

/** A brand's letter on its hue: the scheme's pair on a screen, the light palette's on paper. */
function BrandMark({ mode, name }: { mode: ProposalBlockMode; name: string }) {
  const hue = categoryHueOf(name);
  const tint = mode === 'paper' ? paperTileTint(hue) : hueTintOf(hue);
  return (
    <View
      style={[styles.mark, { backgroundColor: tint.bg }]}
      importantForAccessibility="no-hide-descendants"
    >
      <Text variant="caption" style={[styles.markLetter, { color: tint.fg }]}>
        {brandLetter(name)}
      </Text>
    </View>
  );
}

function KindWords({
  mode,
  kind,
  words,
  empty,
  ink,
}: {
  mode: ProposalBlockMode;
  kind: PartKindView;
  words: ProposalPartsWords;
  /** The line an empty kind reads; absent for a kind that has its brands. */
  empty?: ReactNode;
  ink: BlockInk;
}) {
  const paper = mode === 'paper';
  return (
    <View style={styles.words}>
      <Text
        variant="caption"
        style={[{ color: ink.tertiary }, paper ? styles.kindPaper : undefined]}
      >
        {kind.name}
        {kind.count === null ? null : ` · ${kind.count}`}
      </Text>
      {empty === undefined ? (
        <>
          <View style={styles.brands}>
            {kind.brands.map((brand, index) => (
              <View key={brand} style={styles.brand}>
                {index > 0 ? (
                  <Text variant="caption" style={{ color: ink.tertiary }}>
                    {words.or}
                  </Text>
                ) : null}
                <BrandMark mode={mode} name={brand} />
                <Text
                  variant="body"
                  style={[
                    styles.brandName,
                    { color: ink.text },
                    paper ? styles.brandPaper : undefined,
                  ]}
                >
                  {brand}
                </Text>
              </View>
            ))}
          </View>
          {[kind.detail, kind.description].map((line) =>
            line === null ? null : (
              <Text
                key={line}
                variant="body-sm"
                style={[{ color: ink.secondary }, paper ? styles.specPaper : undefined]}
              >
                {line}
              </Text>
            ),
          )}
        </>
      ) : (
        <Text
          variant="body"
          style={
            paper
              ? [styles.nonePaper, { color: ink.tertiary }]
              : [styles.none, { color: ink.dangerText }]
          }
        >
          {empty}
        </Text>
      )}
    </View>
  );
}

function Flag({ flag, ink }: { flag: string; ink: BlockInk }) {
  return (
    <View style={[styles.flag, { backgroundColor: ink.successBg }]}>
      <InkGlyph name="shield-check" color={ink.successText} />
      <Text variant="caption" style={[styles.flagWords, { color: ink.successText }]}>
        {flag}
      </Text>
    </View>
  );
}

/** What a tile ends with: the certification its brands hold, else what a press does. */
function TileEnd({ kind, empty, ink }: { kind: PartKindView; empty: boolean; ink: BlockInk }) {
  if (empty) {
    return (
      <View style={[styles.end, { backgroundColor: ink.actionPrimary }]}>
        <InkGlyph name="plus" color={ink.inverse} />
      </View>
    );
  }
  if (kind.flag !== null) return <Flag flag={kind.flag} ink={ink} />;
  return (
    <View style={[styles.end, { backgroundColor: ink.fill }]}>
      <InkGlyph name="chevron-right" color={ink.secondary} />
    </View>
  );
}

function AppTile({
  kind,
  words,
  onPick,
  ink,
}: {
  kind: PartKindView;
  words: ProposalPartsWords;
  onPick: ProposalPartsBlockProps['onPick'];
  ink: BlockInk;
}) {
  const empty = kind.brands.length === 0;
  const tile = [
    tileSurface,
    styles.tile,
    empty ? { backgroundColor: ink.dangerBg, borderColor: ink.danger } : undefined,
  ];
  const inside = (
    <GroundProvider ground="tile">
      <BlockTile mode="app" glyph={kind.glyph} hue={empty ? 'danger' : 'ocean'} size={40} />
      <KindWords
        mode="app"
        kind={kind}
        words={words}
        empty={empty ? words.pick : undefined}
        ink={ink}
      />
      {onPick === undefined ? (
        kind.flag === null ? null : (
          <Flag flag={kind.flag} ink={ink} />
        )
      ) : (
        <TileEnd kind={kind} empty={empty} ink={ink} />
      )}
    </GroundProvider>
  );
  if (onPick === undefined) return <View style={tile}>{inside}</View>;
  return (
    <Pressable
      style={tile}
      onPress={() => onPick(kind.category)}
      accessibilityHint={words.pickKind(kind.name)}
    >
      {inside}
    </Pressable>
  );
}

/**
 * What goes on the roof (`M06-27`): one row per kind — its brands, read as alternatives where two
 * or three are listed, the first brand's specification and warranty, and the certification mark.
 * In the builder a kind is a tile that opens its picker, and an empty one is drawn in the danger
 * tint with its line; on paper an empty kind says it is left out; on the customer's page it is
 * simply absent — no placeholder is ever sent (`M06-17`).
 */
export function ProposalPartsBlock({
  mode,
  categories,
  components,
  words,
  onPick,
}: ProposalPartsBlockProps) {
  const ink = useBlockInk(mode);
  const kinds = partKindViews(categories, components, words);
  const paper = mode === 'paper';
  const shown = mode === 'link' ? kinds.filter((kind) => kind.brands.length > 0) : kinds;
  if (mode === 'app') {
    return (
      <View style={styles.tiles}>
        {shown.map((kind, index) => (
          <Rising key={kind.category} order={index}>
            <AppTile kind={kind} words={words} onPick={onPick} ink={ink} />
          </Rising>
        ))}
      </View>
    );
  }
  return (
    <View>
      {shown.map((kind, index) => {
        const empty = kind.brands.length === 0;
        return (
          <View
            key={kind.category}
            style={[
              styles.row,
              paper ? styles.rowPaper : undefined,
              index === 0 ? styles.rowFirst : { borderTopWidth: 1, borderTopColor: ink.lineSoft },
            ]}
          >
            <BlockTile mode={mode} glyph={kind.glyph} hue={empty ? 'neutral' : 'ocean'} size={40} />
            <KindWords
              mode={mode}
              kind={kind}
              words={words}
              empty={empty ? words.notPicked : undefined}
              ink={ink}
            />
            {empty || kind.flag === null ? null : <Flag flag={kind.flag} ink={ink} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { gap: 10 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    paddingVertical: 14,
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-tile'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
  },
  rowPaper: { paddingVertical: 20 },
  rowFirst: { paddingTop: 0 },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  kindPaper: { fontSize: 13, lineHeight: 18 },
  brands: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 10,
    rowGap: 6,
  },
  /* Held to the words' column: a long name wraps beside its letter, never under the flag. */
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1, maxWidth: '100%' },
  brandName: { flexShrink: 1, fontWeight: '600' },
  brandPaper: { fontSize: 19, lineHeight: 26 },
  specPaper: { fontSize: 15, lineHeight: 22 },
  none: { fontWeight: '500' },
  nonePaper: { fontStyle: 'italic' },
  mark: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  markLetter: { fontWeight: '600', lineHeight: 16 },
  flag: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    height: theme.spacing['sp-6'],
    paddingLeft: 7,
    paddingRight: 9,
    borderRadius: theme.radius['r-pill'],
  },
  flagWords: { fontWeight: '500' },
  end: {
    flexShrink: 0,
    width: theme.spacing['sp-8'],
    height: theme.spacing['sp-8'],
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
