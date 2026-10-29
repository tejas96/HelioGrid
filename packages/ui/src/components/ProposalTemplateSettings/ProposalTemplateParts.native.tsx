import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { ListRow } from '../ListRow/ListRow.native';
import { NumberField } from '../NumberField/NumberField.native';
import { RichText } from '../RichText/RichText.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { Textarea } from '../Textarea/Textarea.native';
import { TemplateSectionsPart, TemplateTimelinePart } from './ProposalTemplateRows.native';
import {
  KW,
  TEMPLATE_ABOUT,
  TEMPLATE_PARTS,
  TEMPLATE_PLAIN_COUNTS,
  TEMPLATE_TERMS_MIN_HEIGHT,
  templatePartOf,
  termsPageCount,
} from './ProposalTemplateSettings.logic';
import type {
  ProposalTemplateSettingsProps,
  TemplateCoverCount,
} from './ProposalTemplateSettings.types';
import { PartSource } from './TemplatePartSource.native';

/** Which part's fields the editor shows, across the column (`ariaLabel` *Edit*). */
export function TemplatePartSwitch({ words, part, onPart }: ProposalTemplateSettingsProps) {
  return (
    <SegmentedControl
      ariaLabel={words.edit}
      options={TEMPLATE_PARTS.map((value) => ({ value, label: words[value] }))}
      value={part}
      onChange={(value) => {
        const chosen = templatePartOf(value);
        if (chosen !== undefined) onPart(chosen);
      }}
      style={styles.fullWidth}
    />
  );
}

/** The one part the editor's switch has open. */
export function TemplatePart(props: ProposalTemplateSettingsProps) {
  if (props.part === 'sections') return <TemplateSectionsPart {...props} />;
  if (props.part === 'timeline') return <TemplateTimelinePart {...props} />;
  if (props.part === 'terms') return <TermsPart {...props} />;
  return <CoverPart {...props} />;
}

/** The cover: whose it is, the ruled name, *About*, the kW figure, then the two counts side by side. */
function CoverPart({ words, cover, onWriteOwn }: ProposalTemplateSettingsProps) {
  return (
    <View style={styles.part}>
      <PartSource
        words={words}
        part="cover"
        origin={cover.origin}
        strip={cover.strip}
        onWriteOwn={onWriteOwn}
      />
      <FactRows label={words.document} density="functional">
        <FactRow label={words.documentName} value={words.proposal} density="functional" />
      </FactRows>
      <Textarea
        label={words.about}
        value={cover.about}
        onChange={cover.onAbout}
        rows={TEMPLATE_ABOUT.rows.narrow}
        maxLength={TEMPLATE_ABOUT.maxLength}
        error={cover.aboutError}
        density="functional"
      />
      <View style={styles.counts}>
        <CountField words={words} cover={cover} count="totalCapacityInstalledKw" />
        <View style={styles.countPair}>
          {TEMPLATE_PLAIN_COUNTS.map((count) => (
            <View key={count} style={styles.countCell}>
              <CountField words={words} cover={cover} count={count} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** One cover count; only the kW figure carries a tier, and only while it holds one (`F8-01`). */
function CountField({
  words,
  cover,
  count,
}: Pick<ProposalTemplateSettingsProps, 'words' | 'cover'> & { count: TemplateCoverCount }) {
  const value = cover.counts[count];
  const kw = count === 'totalCapacityInstalledKw';
  return (
    <NumberField
      label={words.counts[count]}
      words={words.numberField}
      {...(value === null ? {} : { value })}
      onCommit={(next) => cover.onCount(count, next)}
      onClear={() => cover.onCount(count, null)}
      min={0}
      steppers={false}
      density="functional"
      {...(kw ? { unit: KW } : { precision: 0 })}
      {...(kw && value !== null
        ? { provenance: { tier: 'estimated' as const, source: words.declaredByYou, size: 12 } }
        : {})}
    />
  );
}

/** The terms: whose they are, then the editor in the strip's language with its page count. */
function TermsPart({ words, terms, onWriteOwn }: ProposalTemplateSettingsProps) {
  const pages = termsPageCount(terms.value);
  return (
    <View style={styles.part}>
      <PartSource
        words={words}
        part="terms"
        origin={terms.origin}
        strip={terms.strip}
        onWriteOwn={onWriteOwn}
      />
      <View style={styles.terms}>
        {/* Above the editor, so a refused save's reason is in view over the act bar. */}
        {terms.error === undefined ? null : (
          <Text variant="caption" color="danger" live>
            {terms.error}
          </Text>
        )}
        <RichText
          /* A new language is a new body: the editor starts again from that language's value. */
          key={terms.strip.value}
          words={words.richText}
          label={words.termsIn(terms.languageName)}
          value={terms.value}
          onChange={terms.onChange}
          minHeight={TEMPLATE_TERMS_MIN_HEIGHT}
          pageEstimate={
            pages === 0 ? undefined : (
              <Text variant="caption" color="secondary">
                {words.pages(pages)}
              </Text>
            )
          }
        />
      </View>
    </View>
  );
}

/** The single write-points the document prints from: a hairline, then a row each, flush. */
export function TemplateLinks({
  words,
  bankLine,
  onOpenBranding,
  onOpenProfile,
}: ProposalTemplateSettingsProps) {
  return (
    <View>
      <View style={styles.hairline} />
      <ListRow
        icon={<ShellGlyph name="palette" size="md" tone="secondary" />}
        title={words.brandingRow}
        subtitle={words.brandingFrom}
        trailing={<ShellGlyph name="chevron-right" size="md" />}
        onClick={onOpenBranding}
        density="functional"
        style={styles.flushRow}
      />
      <ListRow
        icon={<ShellGlyph name="building" size="md" tone="secondary" />}
        title={words.bankRow}
        subtitle={bankLine}
        trailing={<ShellGlyph name="chevron-right" size="md" />}
        onClick={onOpenProfile}
        density="functional"
        style={styles.flushRow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
  /** A part's blocks, `sp-4` apart. */
  part: { gap: theme.spacing['sp-4'] },
  /** The kW figure across, the two counts under it side by side, `sp-3` apart. */
  counts: { gap: theme.spacing['sp-3'] },
  countPair: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  countCell: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  /** The editor over its refusal. */
  terms: { gap: theme.spacing['sp-1'] },
  /** The soft rule over the two rows. */
  hairline: { height: 1, backgroundColor: theme.colors['line-soft'] },
  /** The rows flush with the column's edges. */
  flushRow: { paddingLeft: 0, paddingRight: 0 },
});
