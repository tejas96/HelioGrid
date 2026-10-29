import type { TranslatedText } from '@heliogrid/contracts';
import type { ProposalSection, TemplateEdit, TimelinePhase, UiLanguage } from '@heliogrid/domain';
import { brandingDocumentOf } from '../BrandingSettings/BrandingSettings.logic';
import type { BrandingDocumentFacts } from '../BrandingSettings/BrandingSettings.types';
import type { RichTextValue } from '../RichText/RichText.types';
import { TEMPLATE_SAMPLE } from './ProposalTemplateSettings.logic';
import type {
  ProposalTemplateSettingsProps,
  TemplateCoverCount,
  TemplateDocument,
  TemplateLanguageStrip,
  TemplateOrigin,
  TemplatePhaseEditorProps,
} from './ProposalTemplateSettings.types';

/**
 * The four parts both screens hand `ProposalTemplateSettings`, bound once from the page's view
 * (`@heliogrid/data`'s `templateViewOf`, read here by its shape) and the screen's words and acts —
 * so the web and the phone cannot wire a part two ways.
 */

type Written = Readonly<Record<UiLanguage, 'authored' | 'empty'>>;

/** `templateViewOf`'s answer, as this binder reads it. */
export interface TemplateViewShape {
  readonly cover: {
    readonly origin: TemplateOrigin;
    readonly about: string;
    readonly written: Written;
    readonly counts: Readonly<Record<TemplateCoverCount, number | null>>;
  };
  readonly sections: {
    readonly origin: TemplateOrigin;
    readonly rows: readonly {
      readonly key: ProposalSection;
      readonly on: boolean;
      readonly floor: boolean;
    }[];
    readonly printing: number;
    readonly of: number;
  };
  readonly terms: {
    readonly origin: TemplateOrigin;
    readonly value: RichTextValue;
    readonly written: Written;
  };
  readonly timeline: {
    readonly origin: TemplateOrigin;
    readonly phases: readonly {
      readonly key: number;
      // biome-ignore lint/plugin/copy-prop-type: the phase's name as the company wrote it
      readonly title: string;
      // biome-ignore lint/plugin/copy-prop-type: the phase's note as the company wrote it
      readonly note: string;
      readonly phase: TimelinePhase;
    }[];
    readonly atCap: boolean;
  };
}

export interface TemplateBinding {
  /** The strip's languages in the set's order, each named in itself. */
  readonly languages: readonly { readonly code: UiLanguage; readonly label: TranslatedText }[];
  readonly coverLanguage: UiLanguage;
  readonly termsLanguage: UiLanguage;
  onCoverLanguage(language: UiLanguage): void;
  onTermsLanguage(language: UiLanguage): void;
  /** A section's name and line in the reader's words (`sectionWords`). */
  sectionWord(key: ProposalSection): {
    readonly title: TranslatedText;
    readonly about: TranslatedText;
  };
  readonly aboutError?: TranslatedText;
  readonly termsError?: TranslatedText;
  edit(edit: TemplateEdit): void;
  /** Opens the editor on a phase: its key, and the phase as it stands. */
  onEditPhase(key: number, phase: TimelinePhase): void;
  /** Asks before a delete: the phase's key, and its name as the list shows it. */
  onDeletePhase(key: number, title: string): void;
  onAddPhase(): void;
}

function stripOf(
  languages: TemplateBinding['languages'],
  written: Written,
  value: UiLanguage,
  onChange: (language: UiLanguage) => void,
): TemplateLanguageStrip {
  return {
    languages: languages.map(({ code, label }) => ({ code, label, state: written[code] })),
    value,
    onChange: (code) => {
      const chosen = languages.find((language) => language.code === code);
      if (chosen !== undefined) onChange(chosen.code);
    },
  };
}

export function templateSettingsParts(
  view: TemplateViewShape,
  binding: TemplateBinding,
): Pick<ProposalTemplateSettingsProps, 'cover' | 'sections' | 'terms' | 'timeline'> {
  const { edit } = binding;
  const termsLabel = binding.languages.find((language) => language.code === binding.termsLanguage);
  return {
    cover: {
      origin: view.cover.origin,
      strip: stripOf(
        binding.languages,
        view.cover.written,
        binding.coverLanguage,
        binding.onCoverLanguage,
      ),
      about: view.cover.about,
      ...(binding.aboutError === undefined ? {} : { aboutError: binding.aboutError }),
      onAbout: (text) => edit({ kind: 'about', language: binding.coverLanguage, text }),
      counts: view.cover.counts,
      onCount: (count, value) => edit({ kind: 'count', count, value }),
    },
    sections: {
      origin: view.sections.origin,
      rows: view.sections.rows.map((row) => ({ ...row, ...binding.sectionWord(row.key) })),
      printing: view.sections.printing,
      of: view.sections.of,
      onToggle: (key) => {
        const row = view.sections.rows.find((held) => held.key === key);
        if (row !== undefined) edit({ kind: 'section', section: row.key });
      },
    },
    terms: {
      origin: view.terms.origin,
      strip: stripOf(
        binding.languages,
        view.terms.written,
        binding.termsLanguage,
        binding.onTermsLanguage,
      ),
      languageName: termsLabel?.label ?? binding.termsLanguage,
      value: view.terms.value,
      ...(binding.termsError === undefined ? {} : { error: binding.termsError }),
      onChange: (value) => edit({ kind: 'terms', language: binding.termsLanguage, value }),
    },
    timeline: {
      origin: view.timeline.origin,
      phases: view.timeline.phases,
      atCap: view.timeline.atCap,
      onMove: (from, to) => edit({ kind: 'move', from, to }),
      onDelete: (key) => {
        const row = view.timeline.phases.find((held) => held.key === key);
        if (row !== undefined) binding.onDeletePhase(key, row.title);
      },
      onEdit: (key) => {
        const row = view.timeline.phases.find((held) => held.key === key);
        if (row !== undefined) binding.onEditPhase(key, row.phase);
      },
      onAdd: binding.onAddPhase,
    },
  };
}

/** The phase editor's strip: a language reads written once the phase's name holds words in it. */
export function phaseStripOf(
  languages: TemplateBinding['languages'],
  name: Readonly<Partial<Record<UiLanguage, string>>>,
  value: UiLanguage,
  onChange: (language: UiLanguage) => void,
): TemplateLanguageStrip {
  const written = Object.fromEntries(
    languages.map(({ code }) => [code, (name[code] ?? '').trim() === '' ? 'empty' : 'authored']),
  ) as Written;
  return stripOf(languages, written, value, onChange);
}

/**
 * What the stage prints, from the view: the cover facts as Branding draws them, the optional
 * sections in the document's order with whether each prints, the terms in the strip's language,
 * and the sample number and the date the screen formats. The stage and the full-size reader both
 * draw it.
 */
export function templateDocumentOf(
  view: TemplateViewShape | null,
  facts: {
    readonly cover: Omit<BrandingDocumentFacts, 'taxIdLabel'> | null;
    // biome-ignore lint/plugin/copy-prop-type: the market pack's name for the tax id
    readonly taxIdLabel: string;
    readonly colour: string | null;
    readonly docDate: string;
  },
  sectionWord: TemplateBinding['sectionWord'],
): TemplateDocument {
  return {
    facts: brandingDocumentOf(facts.cover, facts.taxIdLabel),
    colour: facts.colour,
    sections: (view?.sections.rows ?? [])
      .filter((row) => !row.floor)
      .map((row) => ({ label: sectionWord(row.key).title, included: row.on })),
    terms: view?.terms.value ?? { version: 1, blocks: [] },
    docNumber: TEMPLATE_SAMPLE.docNumber,
    docDate: facts.docDate,
  };
}

/** The phase editor's fields from its flow (`usePhaseEditor`, read here by its shape) and its words. */
export function phaseEditorFieldsOf(
  editor: {
    readonly phase: TimelinePhase;
    readonly language: UiLanguage;
    chooseLanguage(language: UiLanguage): void;
    editName(text: string): void;
    editWhat(text: string): void;
  },
  languages: TemplateBinding['languages'],
  errors: { readonly nameError?: TranslatedText; readonly whatError?: TranslatedText },
): TemplatePhaseEditorProps['fields'] {
  return {
    strip: phaseStripOf(languages, editor.phase.name, editor.language, editor.chooseLanguage),
    name: editor.phase.name[editor.language] ?? '',
    what: editor.phase.description[editor.language] ?? '',
    ...(errors.nameError === undefined ? {} : { nameError: errors.nameError }),
    ...(errors.whatError === undefined ? {} : { whatError: errors.whatError }),
    onName: editor.editName,
    onWhat: editor.editWhat,
  };
}
