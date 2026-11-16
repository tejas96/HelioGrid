import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Rising } from '../../primitives/rising.native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import type { RichTextValue as ViewValue } from '../RichText/RichText.types';
import { RichTextView } from '../RichText/RichTextView.native';
import { TenantMark } from '../TenantHeader/TenantHeader.native';
import { BlockFigure, BlockTier, BlockTile, MONO } from './BlockParts.native';
import { type BlockInk, useBlockInk } from './block-ink.native';
import {
  accountShown,
  bankRouting,
  type PhaseView,
  phaseViews,
  recordCells,
  termsShown,
} from './ProposalBlocks.facts';
import type {
  ProposalBankBlockProps,
  ProposalCompanyBlockProps,
  ProposalTermsBlockProps,
  ProposalTimelineBlockProps,
  ProposalTrackRecordBlockProps,
} from './ProposalBlocks.types';

// web-only parts: HueTile, Provenance — tiles and tiers come through BlockParts.native.

const display = theme.type.families.display;
const mono = theme.type.families.mono;

/** One step of the timeline: its number on the rail, its words, and how long it takes. */
function TimelineStep({
  phase,
  number,
  last,
  paper,
  ink,
}: {
  phase: PhaseView;
  number: number;
  last: boolean;
  paper: boolean;
  ink: BlockInk;
}) {
  const side = paper ? 40 : 28;
  const paperOnly = <T,>(style: T): T | undefined => (paper ? style : undefined);
  return (
    <View style={[styles.step, paperOnly(styles.stepPaper)]}>
      <View style={styles.rail}>
        <View
          style={[styles.number, { width: side, height: side, backgroundColor: ink.accentSubtle }]}
        >
          <Text
            variant="mono"
            style={[
              styles.numberWord,
              { color: ink.accentText },
              paperOnly(styles.numberWordPaper),
            ]}
          >
            {number}
          </Text>
        </View>
        {last ? null : <View style={[styles.line, { backgroundColor: ink.accentSubtle }]} />}
      </View>
      <View style={[styles.stepWords, last ? undefined : styles.stepGap]}>
        <Text
          variant="body"
          style={[styles.stepTitle, { color: ink.text }, paperOnly(styles.titlePaper)]}
        >
          {phase.title}
        </Text>
        <Text variant="body-sm" style={[{ color: ink.secondary }, paperOnly(styles.notePaper)]}>
          {phase.note}
        </Text>
      </View>
      {phase.duration === null ? null : (
        <Text
          variant="mono"
          style={[styles.days, { color: ink.tertiary }, paperOnly(styles.daysPaper)]}
        >
          {phase.duration}
        </Text>
      )}
    </View>
  );
}

/**
 * From today to switch-on (`M06-12`): the company's own steps in order, numbered and joined by a
 * line, each with its sentence and how long it takes.
 */
export function ProposalTimelineBlock({
  mode,
  phases,
  before = 0,
  words,
}: ProposalTimelineBlockProps) {
  const ink = useBlockInk(mode);
  const steps = phaseViews(phases, words);
  return (
    <View accessibilityRole="list">
      {steps.map((phase, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a timeline's steps keep their order and may repeat a name
        <Rising key={index} order={index}>
          <TimelineStep
            phase={phase}
            number={before + index + 1}
            last={index === steps.length - 1}
            paper={mode === 'paper'}
            ink={ink}
          />
        </Rising>
      ))}
    </View>
  );
}

/** The company's track record (`M06-08`): its counts, each over its own words. */
export function ProposalTrackRecordBlock({ mode, record, words }: ProposalTrackRecordBlockProps) {
  const ink = useBlockInk(mode);
  const paper = mode === 'paper';
  const cells = recordCells(record, words, useFormat());
  if (cells.length === 0) return null;
  return (
    <View style={[styles.record, paper ? styles.recordPaper : undefined]}>
      {cells.map((cell) => (
        <View
          key={cell.name}
          style={[
            styles.recordCell,
            paper ? [styles.recordCellPaper, { borderTopColor: ink.accent }] : undefined,
          ]}
        >
          <BlockFigure mode={mode} figure={cell.figure} size="display" />
          <Text
            variant="body-sm"
            style={[{ color: ink.secondary }, paper ? styles.notePaper : undefined]}
          >
            {cell.name}
          </Text>
          {cell.tier === undefined ? null : <BlockTier mode={mode} tier={cell.tier} />}
        </View>
      ))}
    </View>
  );
}

/**
 * Who the proposal is from and who it is for (`M06-07`, `M06-16`): the company's mark, name,
 * address and tax registration, then the customer, the site, the number and how they take the
 * system. A fact the company has not given is left out; nothing stands in for it (`M06-17`).
 */
export function ProposalCompanyBlock({ mode, company, words }: ProposalCompanyBlockProps) {
  const ink = useBlockInk(mode);
  return (
    <View style={styles.company}>
      <View style={[styles.band, { backgroundColor: ink.fill }]}>
        <TenantMark logo={company.logoSrc} name={company.name} size={44} showName={false} />
        <View style={styles.bandWords}>
          <Text variant="display" style={[styles.companyName, { color: ink.text }]}>
            {company.name}
          </Text>
          {company.address === undefined ? null : (
            <Text variant="caption" style={{ color: ink.secondary }}>
              {company.address}
            </Text>
          )}
          {company.taxId === undefined ? null : (
            <Text variant="caption" style={[MONO, { color: ink.secondary }]}>
              {company.taxId}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.foot}>
        <View style={styles.bandWords}>
          <Text variant="overline" style={{ color: ink.tertiary }}>
            {words.proposalOverline}
          </Text>
          <Text variant="display" style={[styles.customer, { color: ink.text }]}>
            {company.customerName}
          </Text>
          {company.siteAddress === undefined ? null : (
            <Text variant="body-sm" style={{ color: ink.secondary }}>
              {company.siteAddress}
            </Text>
          )}
        </View>
        <View style={styles.meta}>
          <Text variant="mono" style={[MONO, styles.number2, { color: ink.text }]}>
            {company.number ?? words.draft}
          </Text>
          <Text variant="body-sm" style={[styles.metaWords, { color: ink.secondary }]}>
            {words.type}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** The version's terms, as the company wrote them (`M06-15`) — read, never edited, here. */
export function ProposalTermsBlock({ mode, terms, logoSrc, words }: ProposalTermsBlockProps) {
  const ink = useBlockInk(mode);
  const paper = mode === 'paper';
  /* On paper the words take the page's fixed ink; on a screen the reader's own, which follows the scheme. */
  const paperInk = paper && typeof ink.text === 'string' ? ink.text : undefined;
  return (
    <RichTextView
      value={termsShown(terms, logoSrc) as ViewValue}
      logoSrc={logoSrc}
      logoLabel={words.logoLabel}
      fontSize={paper ? 16 : 14}
      color={paperInk}
      muted={paperInk}
    />
  );
}

/**
 * Where the customer pays (`M06-17`): the company's own account, as the business profile holds it.
 * A proposal that does not print it shows the block dimmed, with its line, to the person building.
 */
export function ProposalBankBlock({
  mode,
  bank,
  notPrinted = false,
  words,
}: ProposalBankBlockProps) {
  const ink = useBlockInk(mode);
  const format = useFormat();
  const paper = mode === 'paper';
  const off = mode === 'app' && notPrinted;
  const line = [{ color: ink.secondary }, paper ? styles.bankLinePaper : undefined];
  return (
    <View
      style={[styles.bank, paper ? [styles.bankPaper, { backgroundColor: ink.fill }] : undefined]}
    >
      <View style={[styles.bankMain, off ? styles.dim : undefined]}>
        <BlockTile mode={mode} glyph="credit-card" hue="teal" size={44} />
        <View style={styles.bandWords}>
          <Text
            variant="body"
            style={[styles.bankName, { color: ink.text }, paper ? styles.bankNamePaper : undefined]}
          >
            {bank.bankName}
          </Text>
          <Text variant="body-sm" style={line}>
            {bank.accountName}
          </Text>
          <Text variant="mono" style={[MONO, line]}>
            {words.account(accountShown(bank.accountNumber, mode))}
          </Text>
          <Text variant="mono" style={[MONO, line]}>
            {bankRouting(bank, format)}
          </Text>
        </View>
      </View>
      {off ? (
        <View style={[styles.pill, { backgroundColor: ink.neutralBg }]}>
          <Text variant="caption" style={{ color: ink.neutralText }}>
            {words.notPrinted}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  stepPaper: { gap: 18 },
  rail: { alignItems: 'center', alignSelf: 'stretch' },
  number: { borderRadius: theme.radius['r-pill'], alignItems: 'center', justifyContent: 'center' },
  numberWord: {
    fontFamily: mono,
    fontWeight: '500',
    fontSize: theme.type.roles['body-sm'].fontSize,
    lineHeight: 16,
  },
  numberWordPaper: { fontSize: theme.type.document['doc-fs'], lineHeight: 20 },
  line: { flex: 1, width: 2, borderRadius: theme.radius['r-pill'], marginVertical: 2 },
  stepWords: { flex: 1, minWidth: 0 },
  stepGap: { paddingBottom: theme.spacing['sp-4'] },
  stepTitle: { fontWeight: '500' },
  titlePaper: { fontSize: theme.type.document['doc-fs-lead'], lineHeight: 26 },
  notePaper: { fontSize: theme.type.document['doc-fs'], lineHeight: 22 },
  days: { fontFamily: mono, lineHeight: 28 },
  daysPaper: { fontSize: theme.type.document['doc-fs-small'], lineHeight: 40 },
  record: { flexDirection: 'row', gap: theme.spacing['sp-3'] },
  recordPaper: { gap: 24 },
  recordCell: { flex: 1, flexBasis: 0, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  recordCellPaper: { paddingTop: 22, borderTopWidth: 3 },
  company: { borderRadius: theme.radius['r-lg'], overflow: 'hidden' },
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-5'],
  },
  bandWords: { flex: 1, minWidth: 0 },
  companyName: {
    fontFamily: display,
    fontWeight: '400',
    fontSize: theme.type.roles.h2.fontSize,
    lineHeight: 24,
  },
  foot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-5'],
  },
  customer: {
    fontFamily: display,
    fontWeight: '400',
    fontSize: theme.type.roles.h2.fontSize,
    lineHeight: 28,
  },
  meta: { flexShrink: 0, alignItems: 'flex-end' },
  number2: { fontWeight: '500', lineHeight: 28 },
  metaWords: { textAlign: 'right' },
  bank: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-4'] },
  bankPaper: { padding: 28, borderRadius: theme.radius['r-lg'] },
  bankMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-4'] },
  dim: { opacity: 0.45 },
  bankName: { fontWeight: '600' },
  bankNamePaper: { fontSize: theme.type.document['doc-fs-figure'], lineHeight: 28 },
  bankLinePaper: { fontSize: theme.type.document['doc-fs'], lineHeight: 26 },
  pill: {
    flexShrink: 0,
    height: theme.spacing['sp-6'],
    paddingHorizontal: 10,
    borderRadius: theme.radius['r-pill'],
    justifyContent: 'center',
  },
});
