import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';

/* The sheet's own vocabulary. Same split as DocumentPreview.css: every COLOUR is a theme token,
   while the type sizes (8–17dp) and paddings (20/28dp) are the print geometry of a 480dp design
   sheet that is scaled as a whole — a document's letterhead is not a card, so the app's 4dp
   spacing scale and 12dp type floor do not describe it. */

const sans = theme.type.families.sans;
const mono = theme.type.families.mono;
const ink = theme.colors['text-primary'];
const muted = theme.colors['text-secondary'];
const faint = theme.colors['text-tertiary'];

export const docStyles = StyleSheet.create({
  window: {
    borderRadius: theme.radius['r-lg'],
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e3,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    flexDirection: 'column',
  },
  band: {
    paddingVertical: 20,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  bandWords: { flexShrink: 1, minWidth: 0 },
  company: { fontFamily: sans, fontWeight: '700', fontSize: 17, letterSpacing: -0.34 },
  tagline: { fontFamily: sans, fontWeight: '500', fontSize: 10, marginTop: 2 },
  address: { fontFamily: sans, fontSize: 10, lineHeight: 14, marginTop: 3 },
  lines: { fontFamily: sans, fontSize: 9, lineHeight: 13, marginTop: 2 },
  letterheadNode: { marginTop: 4 },
  logo: { height: 34, flexShrink: 0 },
  slot: {
    width: 90,
    height: 34,
    borderRadius: theme.radius['rf-sm'],
    backgroundColor: theme.colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  slotLabel: {
    fontFamily: mono,
    fontSize: 8,
    letterSpacing: 0.32,
    color: faint,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  cover: {
    paddingTop: 22,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
  },
  overline: {
    fontFamily: sans,
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 1.08,
    textTransform: 'uppercase',
    color: faint,
  },
  overlineSpaced: { marginTop: 12 },
  customerName: {
    fontFamily: sans,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.14,
    marginTop: 4,
    color: ink,
  },
  customerMeta: { fontFamily: sans, fontSize: 10, color: muted, marginTop: 2 },
  metaBlock: { alignItems: 'flex-end' },
  docTitle: { fontFamily: sans, fontWeight: '700', fontSize: 15, letterSpacing: -0.3 },
  docNumber: { fontFamily: mono, fontSize: 10, color: muted, marginTop: 4 },
  docDate: { fontFamily: sans, fontSize: 10, color: faint, marginTop: 2 },
  body: { paddingTop: 20, paddingHorizontal: 28, flexDirection: 'column', gap: 18, flexGrow: 1 },
  rule: { height: 2, borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 7, gap: 8 },
  rowFirst: { marginTop: 12 },
  cell: { fontFamily: sans, fontSize: 11, color: ink, flexShrink: 1, flexGrow: 1 },
  amount: {
    fontFamily: mono,
    fontSize: 11,
    color: ink,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  totalRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
  },
  totalLabel: { fontFamily: sans, fontWeight: '700', fontSize: 12, letterSpacing: -0.12 },
  totalValue: {
    fontFamily: mono,
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.34,
    fontVariant: ['tabular-nums'],
  },
  subsidy: { fontFamily: sans, fontSize: 10, color: muted, textAlign: 'right', marginTop: 6 },
  sectionList: { marginTop: 8, flexDirection: 'column', gap: 5 },
  sectionItem: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  sectionIndex: { fontFamily: mono, fontSize: 9, color: faint, width: 14, flexShrink: 0 },
  sectionLabel: { fontFamily: sans, fontSize: 11, color: ink, flexGrow: 1, flexShrink: 1 },
  sectionMeta: { fontFamily: sans, fontSize: 9, color: faint, flexShrink: 0 },
  trancheRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, gap: 8 },
  trancheIndex: { fontFamily: mono, fontSize: 9, color: faint, width: 18, flexShrink: 0 },
  trancheCell: { flexGrow: 1, flexShrink: 1 },
  trancheLabel: { fontFamily: sans, fontWeight: '700', fontSize: 11, letterSpacing: -0.11 },
  trancheWhen: { fontFamily: sans, fontSize: 10, color: muted },
  trancheShare: { fontFamily: sans, fontSize: 10, color: muted, textAlign: 'right' },
  trancheAmount: {
    fontFamily: mono,
    fontWeight: '700',
    fontSize: 11,
    color: ink,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  /* Where the terms band sits. Its TYPE is RichTextView's — one read-only renderer (M06-51). */
  terms: { marginTop: 8 },
  footer: {
    paddingTop: 14,
    paddingBottom: 20,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  footerText: { fontFamily: sans, fontSize: 9, color: faint },
  footerTax: { fontFamily: mono, fontSize: 9, color: faint },
  footerNote: { fontFamily: sans, fontSize: 9, color: faint, textAlign: 'center', flexShrink: 1 },
  caption: { marginTop: theme.spacing['sp-2'] },
  captionNote: { color: theme.colors['warning-text'] },
});

/** The brand rule that opens every band — full strength only when it clears the mark floor. */
export function DocumentRule({ colour, opaque }: { colour: string; opaque: boolean }) {
  return <View style={[docStyles.rule, { backgroundColor: colour, opacity: opaque ? 1 : 0.55 }]} />;
}

/** The band's micro-label. 9dp is design-space type inside a scaled sheet, not app type. */
export function DocumentOverline({ children, spaced }: { children: string; spaced?: boolean }) {
  return (
    <Text style={[docStyles.overline, spaced === true ? docStyles.overlineSpaced : undefined]}>
      {children}
    </Text>
  );
}

/** The labelled placeholder slot that stands in until a logo arrives. */
export function DocumentSlot({ label }: { label: string }) {
  return (
    <View style={docStyles.slot}>
      <Text style={docStyles.slotLabel}>{label}</Text>
    </View>
  );
}
