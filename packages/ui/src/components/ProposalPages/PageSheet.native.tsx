import { theme } from '@heliogrid/theme';
import { type ReactNode, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { CustomerSurface } from '../CustomerSurface/CustomerSurface.native';
import { TenantScopeContext } from '../CustomerSurface/tenant-scope';
import {
  type PaperScope,
  PaperScopeContext,
  useBlockInk,
} from '../ProposalBlocks/block-ink.native';
import { ProposalPicture } from '../ProposalPicture/ProposalPicture.native';
import { TenantMark } from '../TenantHeader/TenantHeader.native';
import { DeepGround } from './PageGround.native';
import { bodyFit, sheetPlace } from './ProposalPages.logic';
import type { PageFrame } from './ProposalPages.plan';
import { PROPOSAL_PAGE_SIZE, type ProposalPageProps } from './ProposalPages.types';

const display = theme.type.families.display;
const mono = theme.type.families.mono;

/**
 * The tenant's colour as a page may carry it (`F5-81`, `F7-07`): the mark's own pair for
 * `TenantMark`, and the compliant shade for the accents. The web half writes the same tokens as
 * custom properties; a phone hands them down by context.
 */
export function usePaperScope(
  brandColor: string | undefined,
  tone: PaperScope['tone'],
): { readonly tenant: Record<string, string> | null; readonly paper: PaperScope } {
  return useMemo(() => {
    const tenant = CustomerSurface.tokens(brandColor);
    const ink = tenant?.['--accent'];
    const subtle = tenant?.['--accent-subtle'];
    const text = tenant?.['--accent-hover'];
    const accent =
      ink === undefined || subtle === undefined || text === undefined
        ? undefined
        : { ink, subtle, text };
    return { tenant, paper: { tone, accent } };
  }, [brandColor, tone]);
}

export interface PageSheetProps extends ProposalPageProps, PageFrame {
  children: ReactNode;
}

/** The page's own words, drawn inside the page's scope so they take its ink. */
function SheetFrame({
  page,
  part,
  snapshot,
  facts,
  words,
  lead,
  band,
  children,
}: Omit<PageSheetProps, 'tone' | 'still'>) {
  const ink = useBlockInk('paper');
  /* A body longer than its page is fitted to it whole. The fit only ever tightens while the page is
     mounted: once fitted, the body is laid out wider and so measures shorter, and a fit that
     followed that measure back up would swing between the two. */
  const [room, setRoom] = useState(0);
  const [natural, setNatural] = useState(0);
  const [fit, setFit] = useState(1);
  const tighten = (space: number, height: number) =>
    setFit((held) => Math.min(held, bodyFit(space, height)));
  const { company } = snapshot;
  const { number, count } = sheetPlace({ page, part, snapshot });
  return (
    <>
      {band === undefined ? null : <ProposalPicture name={band} style={styles.band} />}
      <View style={[styles.padded, band === undefined ? styles.paddedTop : undefined]}>
        <View style={styles.head}>
          <View style={styles.headCompany}>
            <TenantMark
              logo={facts.logoSrc}
              name={company.name}
              size={26}
              radius={8}
              showName={false}
            />
            <Text variant="caption" style={[styles.headName, { color: ink.text }]}>
              {company.name}
            </Text>
          </View>
          <Text variant="mono" style={[styles.headMeta, { color: ink.tertiary }]}>
            {words.head}
          </Text>
        </View>
        <Text
          variant="h1"
          style={[
            styles.title,
            { color: ink.text },
            band === undefined ? undefined : styles.titleBand,
          ]}
        >
          {words.titles[page]}
        </Text>
        <View style={[styles.rule, { backgroundColor: ink.accent }]} />
        {lead === undefined || lead === null ? null : (
          <Text variant="body" style={[styles.lead, { color: ink.secondary }]}>
            {lead}
          </Text>
        )}
        <View
          style={styles.body}
          onLayout={(event) => {
            setRoom(event.nativeEvent.layout.height);
            tighten(event.nativeEvent.layout.height, natural);
          }}
        >
          <View
            onLayout={(event) => {
              setNatural(event.nativeEvent.layout.height);
              tighten(room, event.nativeEvent.layout.height);
            }}
            style={[
              styles.bodyFit,
              fit === 1
                ? styles.bodyWhole
                : {
                    width: `${100 / fit}%`,
                    transform: [
                      { translateX: -(contentWidth * (1 / fit - 1)) / 2 },
                      { translateY: -(natural * (1 - fit)) / 2 },
                      { scale: fit },
                    ],
                  },
            ]}
          >
            {children}
          </View>
        </View>
        <View style={[styles.foot, { borderTopColor: ink.lineSoft }]}>
          <Text variant="caption" style={[styles.footWords, { color: ink.tertiary }]}>
            {words.foot ?? snapshot.deal.clientName}
          </Text>
          <Text variant="mono" style={[styles.footNumber, { color: ink.tertiary }]}>
            {`${number} / ${count}`}
          </Text>
        </View>
      </View>
    </>
  );
}

/** The page's side padding, and so the width its body is laid out in. */
const SIDE = 64;
const contentWidth = PROPOSAL_PAGE_SIZE.width - SIDE * 2;

/**
 * One inner page of the document at its design size: the company and the version at its head, the
 * title with the brand rule, an optional lead, the body, and the foot with the page's number among
 * the pages that print. A body longer than its page is fitted to it whole (`bodyFit`).
 */
export function PageSheet({ tone, still: _still, ...sheet }: PageSheetProps) {
  const scope = usePaperScope(sheet.snapshot.company.brandColour ?? undefined, tone ?? 'plain');
  return (
    <TenantScopeContext.Provider value={scope.tenant}>
      <PaperScopeContext.Provider value={scope.paper}>
        <View style={styles.page}>
          {tone === 'deep' ? <DeepGround /> : null}
          <SheetFrame {...sheet} />
        </View>
      </PaperScopeContext.Provider>
    </TenantScopeContext.Provider>
  );
}

/* The page is paper: its sizes are print geometry against the 794 dp page, as the web half's are,
   and its white is the light palette's in every scheme. */
const styles = StyleSheet.create({
  page: {
    width: PROPOSAL_PAGE_SIZE.width,
    height: PROPOSAL_PAGE_SIZE.height,
    overflow: 'hidden',
    backgroundColor: theme.palettes.light.surface,
  },
  band: { height: 216 },
  padded: { flex: 1, paddingHorizontal: SIDE, paddingBottom: 44 },
  paddedTop: { paddingTop: 56 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headCompany: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  headName: { fontWeight: '600', fontSize: 13, lineHeight: 18 },
  headMeta: { fontFamily: mono, fontSize: 13, lineHeight: 18 },
  title: {
    marginTop: 44,
    fontFamily: display,
    fontWeight: '400',
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -0.88,
  },
  titleBand: { marginTop: 30 },
  rule: { width: 64, height: 3, marginTop: 20, borderRadius: 3 },
  lead: { marginTop: 22, maxWidth: 560, fontSize: 17, lineHeight: 26 },
  body: { flex: 1, marginTop: 36, overflow: 'hidden' },
  bodyFit: { gap: 36 },
  bodyWhole: { minHeight: '100%' },
  foot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footWords: { fontSize: 12, lineHeight: 16, flexShrink: 1 },
  footNumber: { fontFamily: mono, fontSize: 12, lineHeight: 16 },
});
