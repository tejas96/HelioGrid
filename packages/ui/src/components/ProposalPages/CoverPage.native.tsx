import type { ProvenanceTier as ProvenanceTierName } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { TenantScopeContext } from '../CustomerSurface/tenant-scope';
import { useFormat } from '../MarketProvider/market-context';
import { withAlpha } from '../ProposalBlocks/block-ink.native';
import { PICTURE_INK, ProposalPicture } from '../ProposalPicture/ProposalPicture.native';
import { useProvenanceWords } from '../Provenance/Provenance.words';
import { TenantMark } from '../TenantHeader/TenantHeader.native';
import { usePaperScope } from './PageSheet.native';
import { coverFiguresOf } from './ProposalPages.logic';
import { PROPOSAL_PAGE_SIZE, type ProposalCoverProps } from './ProposalPages.types';

const display = theme.type.families.display;
const mono = theme.type.families.mono;
const LIGHT = theme.palettes.light;
/* The glass and its edges: the picture's white ink let through, as the web half's frost is mixed. */
const GLASS: string = withAlpha(LIGHT['text-inverse'], 0.13);
const GLASS_EDGE: string = withAlpha(LIGHT['text-inverse'], 0.22);
/* The number's pill: 64% ink over any picture holds white words at 4.5:1 or better. */
const PILL: string = withAlpha(LIGHT.ink, 0.64);

/** One of the cover's figures on glass: the value in the display face over its own words. */
function GlassCell({
  value,
  label,
  tier,
  first,
}: {
  value: string;
  label: string;
  /** The figure's tier (`F8-01`: a payback is a money figure). */
  tier?: ProvenanceTierName;
  first: boolean;
}) {
  const words = useProvenanceWords();
  return (
    <View style={[styles.cell, first ? undefined : styles.cellEdge]}>
      <Text variant="figure" style={styles.value} oneLine>
        {value}
      </Text>
      <View style={styles.labelRow}>
        <Text variant="caption" style={styles.label}>
          {label}
        </Text>
        {tier === undefined ? null : (
          /* The tier in the label's own ink: a page's quiet ink fails AA on the picture's shade. */
          <View style={styles.tier}>
            <View style={styles.tierDot} />
            <Text variant="caption" style={styles.label}>
              {words.tier(tier)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * The cover (`M06-51`): the picture edge to edge, the company's mark and name, the number and the
 * date, who it is for, one line for the system, three figures on glass, and who prepared it with
 * its validity. The words sit on the picture's shade, so they hold WCAG AA over any picture. A
 * draft with no price yet has no figure to state: the glass is left out until one exists.
 *
 * WEB → RN MAPPING: the web's glass is a frost over the picture; a phone draws the same white wash
 * without the blur, which a static style cannot give it.
 */
export function CoverPage({ snapshot, facts, words }: Omit<ProposalCoverProps, 'page'>) {
  const format = useFormat();
  const { company } = snapshot;
  const figures = coverFiguresOf({ snapshot, facts, words }, format);
  const picture = snapshot.fields.company.coverPicture;
  const cover = words.cover;
  const scope = usePaperScope(company.brandColour ?? undefined, 'plain');
  const number = `${facts.number ?? cover.draft} · ${facts.dateText}`;
  return (
    <TenantScopeContext.Provider value={scope.tenant}>
      <ProposalPicture
        name={picture.kind === 'platform' ? picture.key : undefined}
        src={picture.kind === 'own' ? facts.coverSrc : undefined}
        shade="cover"
        style={styles.page}
      >
        <View style={styles.inside}>
          <View style={styles.top}>
            <View style={styles.brand}>
              <TenantMark
                logo={facts.logoSrc}
                name={company.name}
                size={42}
                radius={12}
                showName={false}
              />
              <View style={styles.brandWords}>
                <Text variant="body" style={styles.brandName}>
                  {company.name}
                </Text>
              </View>
            </View>
            <View style={styles.number}>
              <Text variant="mono" style={styles.numberWords}>
                {number}
              </Text>
            </View>
          </View>
          <View style={styles.words}>
            <Text variant="overline" style={styles.over}>
              {cover.over}
            </Text>
            {snapshot.deal.clientName === null ? null : (
              <Text variant="display" style={styles.customer}>
                {snapshot.deal.clientName}
              </Text>
            )}
            {cover.system === undefined ? null : (
              <Text variant="display" style={styles.system}>
                {cover.system}
              </Text>
            )}
          </View>
          {figures.length === 0 ? null : (
            <View style={styles.glass}>
              {figures.map((figure, index) => (
                <GlassCell
                  key={figure.key}
                  value={figure.value}
                  label={figure.label}
                  tier={figure.tier}
                  first={index === 0}
                />
              ))}
            </View>
          )}
          <View style={styles.foot}>
            <Text variant="caption" style={styles.footWords}>
              {cover.preparedBy}
            </Text>
            <Text variant="caption" style={styles.footWords}>
              {cover.validity}
            </Text>
          </View>
        </View>
      </ProposalPicture>
    </TenantScopeContext.Provider>
  );
}

/* Paper, over a photograph: print geometry against the 794 dp page, and the picture's fixed inks —
   white words on its shade, the document's own white for the company's chip. */
const styles = StyleSheet.create({
  page: { width: PROPOSAL_PAGE_SIZE.width, height: PROPOSAL_PAGE_SIZE.height },
  inside: { flex: 1 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    paddingTop: 44,
    paddingHorizontal: 56,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 18,
    borderRadius: theme.radius['r-tile'],
    backgroundColor: LIGHT.surface,
    flexShrink: 1,
  },
  brandWords: { flexShrink: 1 },
  brandName: {
    fontWeight: '600',
    fontSize: theme.type.document['doc-fs'],
    lineHeight: 20,
    color: LIGHT['text-primary'],
  },
  number: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: PILL,
  },
  numberWords: {
    fontFamily: mono,
    fontSize: theme.type.document['doc-fs-small'],
    lineHeight: 16,
    color: PICTURE_INK,
  },
  words: { marginTop: 'auto', paddingHorizontal: 56 },
  over: {
    fontSize: theme.type.document['doc-fs-small'],
    lineHeight: 16,
    letterSpacing: 1.8,
    color: PICTURE_INK,
  },
  customer: {
    marginTop: 12,
    fontFamily: display,
    fontWeight: '400',
    fontSize: theme.type.document['doc-fs-cover'],
    lineHeight: 88,
    letterSpacing: -2.5,
    color: PICTURE_INK,
  },
  system: {
    marginTop: 18,
    maxWidth: 440,
    fontFamily: display,
    fontWeight: '400',
    fontSize: theme.type.document['doc-fs-subtitle'],
    lineHeight: 32,
    color: PICTURE_INK,
  },
  glass: {
    marginTop: 44,
    marginHorizontal: 56,
    flexDirection: 'row',
    borderRadius: theme.radius['r-lg'],
    borderWidth: 1,
    borderColor: GLASS_EDGE,
    backgroundColor: GLASS,
  },
  cell: { flex: 1, flexBasis: 0, minWidth: 0, paddingVertical: 22, paddingHorizontal: 24 },
  cellEdge: { borderLeftWidth: 1, borderLeftColor: GLASS_EDGE },
  value: {
    fontFamily: display,
    fontWeight: '400',
    fontSize: theme.type.document['doc-fs-stat'],
    lineHeight: 36,
    color: PICTURE_INK,
  },
  // The tier on its own line under the caption, as the web's `.hg-pp-cover-label`: the three
  // figures keep one baseline whatever each caption's length.
  labelRow: { marginTop: 4, alignItems: 'flex-start', gap: 2 },
  label: { fontSize: theme.type.document['doc-fs-small'], lineHeight: 18, color: PICTURE_INK },
  tier: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tierDot: {
    width: 5,
    height: 5,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: PICTURE_INK,
  },
  foot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 26,
    paddingHorizontal: 56,
    paddingBottom: 40,
  },
  footWords: {
    fontSize: theme.type.document['doc-fs-small'],
    lineHeight: 18,
    color: PICTURE_INK,
    flexShrink: 1,
  },
});
