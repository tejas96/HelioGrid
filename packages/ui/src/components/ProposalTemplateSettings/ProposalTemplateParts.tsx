import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { FactRow, FactRows } from '../FactRow';
import { ListRow } from '../ListRow/ListRow';
import { NumberField } from '../NumberField/NumberField';
import { RichText } from '../RichText/RichText';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { Textarea } from '../Textarea/Textarea';
import { TemplateSectionsPart, TemplateTimelinePart } from './ProposalTemplateRows';
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
import { type PartProps, PartSource } from './TemplatePartSource';

/** Which part's fields the editor shows, across the editor's width (`ariaLabel` *Edit*). */
export function TemplatePartSwitch({ words, part, onPart }: ProposalTemplateSettingsProps) {
  return (
    <SegmentedControl
      className="hg-template-part-switch"
      ariaLabel={words.edit}
      options={TEMPLATE_PARTS.map((value) => ({ value, label: words[value] }))}
      value={part}
      onChange={(value) => {
        const chosen = templatePartOf(value);
        if (chosen !== undefined) onPart(chosen);
      }}
    />
  );
}

/** The one part being edited. */
export function TemplatePart(props: PartProps) {
  if (props.part === 'sections') return <TemplateSectionsPart {...props} />;
  if (props.part === 'timeline') return <TemplateTimelinePart {...props} />;
  if (props.part === 'terms') return <TermsPart {...props} />;
  return <CoverPart {...props} />;
}

/** The cover: whose it is, the ruled name, *About*, the kW figure, then the two counts side by side. */
function CoverPart({ words, wide, cover, onWriteOwn }: PartProps) {
  return (
    <div className="hg-template-part">
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
        rows={wide ? TEMPLATE_ABOUT.rows.wide : TEMPLATE_ABOUT.rows.narrow}
        maxLength={TEMPLATE_ABOUT.maxLength}
        density="functional"
        {...(cover.aboutError === undefined ? {} : { error: cover.aboutError })}
      />
      <div className="hg-template-counts">
        <CountField {...{ words, cover }} count="totalCapacityInstalledKw" />
        <div className="hg-template-count-pair">
          {TEMPLATE_PLAIN_COUNTS.map((count) => (
            <CountField key={count} {...{ words, cover }} count={count} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * One cover count; empty while unset. Only the kW figure carries a tier — `estimated · declared
 * by you` — and only while it holds a figure (`F8-01`, m19-n2: no tier on the empty kW).
 */
function CountField({
  words,
  cover,
  count,
}: Pick<PartProps, 'words' | 'cover'> & { count: TemplateCoverCount }) {
  const value = cover.counts[count];
  const kw = count === 'totalCapacityInstalledKw';
  return (
    <NumberField
      label={words.counts[count]}
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
function TermsPart({ words, terms, onWriteOwn }: PartProps) {
  const pages = termsPageCount(terms.value);
  return (
    <div className="hg-template-part">
      <PartSource
        words={words}
        part="terms"
        origin={terms.origin}
        strip={terms.strip}
        onWriteOwn={onWriteOwn}
      />
      <div className="hg-template-terms">
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
          {...(pages === 0
            ? {}
            : {
                pageEstimate: (
                  <Text variant="caption" color="secondary">
                    {words.pages(pages)}
                  </Text>
                ),
              })}
        />
      </div>
    </div>
  );
}

/** The single write-points the document prints from: a hairline, then a row each. */
export function TemplateLinks({
  words,
  bankLine,
  onOpenBranding,
  onOpenProfile,
}: ProposalTemplateSettingsProps) {
  return (
    <div className="hg-template-links">
      <div className="hg-template-hairline" />
      <div className="hg-template-link-rows">
        <ListRow
          className="hg-template-link"
          icon={<ShellGlyph name="palette" size="md" tone="secondary" />}
          title={words.brandingRow}
          subtitle={words.brandingFrom}
          trailing={<ShellGlyph name="chevron-right" size="md" />}
          density="functional"
          onClick={onOpenBranding}
        />
        <ListRow
          className="hg-template-link"
          icon={<ShellGlyph name="building" size="md" tone="secondary" />}
          title={words.bankRow}
          subtitle={bankLine}
          trailing={<ShellGlyph name="chevron-right" size="md" />}
          density="functional"
          onClick={onOpenProfile}
        />
      </div>
    </div>
  );
}
