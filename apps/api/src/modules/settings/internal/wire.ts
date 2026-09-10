import type {
  Branding,
  EffectiveSettings as EffectiveSettingsWire,
  Letterhead as LetterheadWire,
  RichTextValueWire,
  TimelineTemplate as TimelineTemplateWire,
  TrancheLine as TrancheLineWire,
  TrancheTemplate as TrancheTemplateWire,
} from '@heliogrid/contracts';
import {
  type BrandingInForce,
  basisPointsToPercent,
  type EffectiveSettings,
  type Letterhead,
  type PerLanguage,
  percentToBasisPoints,
  type RichTextValue,
  type TimelinePhase,
  type TrancheLine,
  type TrancheTemplate,
  type TrancheTemplateContent,
  type UiLanguage,
} from '@heliogrid/domain';

/**
 * Domain's settings shapes as the wire declares them. Domain holds every list readonly and every
 * share in basis points; the wire holds mutable lists and two-decimal percents. The two spellings
 * meet here and nowhere else.
 */

function blockWire(block: RichTextValue['blocks'][number]): RichTextValueWire['blocks'][number] {
  switch (block.type) {
    case 'logo':
      return { type: block.type };
    case 'p':
    case 'h':
      return { type: block.type, spans: [...block.spans] };
    case 'ul':
    case 'ol':
      return { type: block.type, items: block.items.map((item) => [...item]), start: block.start };
  }
}

export function richTextWire(value: RichTextValue): RichTextValueWire {
  return { version: value.version, blocks: value.blocks.map(blockWire) };
}

export function perLanguageWire<T, W>(
  value: PerLanguage<T>,
  map: (one: T) => W,
): { en: W } & Partial<Record<UiLanguage, W>> {
  const wire: { en: W } & Partial<Record<UiLanguage, W>> = { en: map(value.en) };
  if (value.hi !== undefined) wire.hi = map(value.hi);
  if (value.mr !== undefined) wire.mr = map(value.mr);
  return wire;
}

export function letterheadWire(letterhead: Letterhead): LetterheadWire {
  return {
    tagline: letterhead.tagline,
    lines: [...letterhead.lines],
    footerNote: letterhead.footerNote,
  };
}

export function brandingWire(branding: BrandingInForce): Branding {
  return {
    brandColour: branding.brandColour,
    letterhead: branding.letterhead === null ? null : letterheadWire(branding.letterhead),
    shades: branding.shades,
  };
}

export function timelineWire(phases: readonly TimelinePhase[]): TimelineTemplateWire {
  return { phases: [...phases] };
}

export function trancheLineWire(line: TrancheLine): TrancheLineWire {
  return {
    label: line.label,
    percent: basisPointsToPercent(line.share),
    dueOnStage: line.dueOnStage,
  };
}

export function trancheLineFromWire(line: TrancheLineWire): TrancheLine {
  return {
    label: line.label,
    share: percentToBasisPoints(line.percent),
    dueOnStage: line.dueOnStage,
  };
}

export function trancheTemplateWire(template: TrancheTemplate): TrancheTemplateWire {
  return {
    id: template.id,
    name: template.name,
    isDefault: template.isDefault,
    archived: template.archived,
    changed: template.changed,
    lines: template.lines.map(trancheLineWire),
  };
}

function trancheContentWire(content: TrancheTemplateContent & { readonly id: string | null }) {
  return { id: content.id, name: content.name, lines: content.lines.map(trancheLineWire) };
}

export function effectiveWire(effective: EffectiveSettings): EffectiveSettingsWire {
  const { proposalTemplate, timelineTemplate, defaultTrancheTemplate } = effective;
  return {
    companyIdentity: effective.companyIdentity,
    taxRegistrations: {
      source: effective.taxRegistrations.source,
      value: [...effective.taxRegistrations.value],
    },
    branding: { source: effective.branding.source, value: brandingWire(effective.branding.value) },
    proposalTemplate: {
      source: proposalTemplate.source,
      value: {
        cover: proposalTemplate.value.cover,
        sectionsIncluded: [...proposalTemplate.value.sectionsIncluded],
        defaultTerms: perLanguageWire(proposalTemplate.value.defaultTerms, richTextWire),
      },
    },
    timelineTemplate: {
      source: timelineTemplate.source,
      value: timelineWire(timelineTemplate.value.phases),
    },
    defaultTrancheTemplate: {
      source: defaultTrancheTemplate.source,
      value: trancheContentWire(defaultTrancheTemplate.value),
    },
    holidays: { source: effective.holidays.source, value: [...effective.holidays.value] },
    locale: effective.locale,
    pendingPromptPoints: [...effective.pendingPromptPoints],
  };
}
