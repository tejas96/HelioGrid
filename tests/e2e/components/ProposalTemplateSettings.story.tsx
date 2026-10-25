import {
  DEFAULT_TERMS,
  DEFAULT_TIMELINE_PHASES,
  formatDate,
  IN_PACK,
  isSectionFloor,
  PROPOSAL_SECTIONS,
  type ProposalSection,
  TIMELINE_PHASE_LIMIT,
  UI_LANGUAGES,
  type UiLanguage,
} from '@heliogrid/domain';
import {
  createTranslator,
  languageName,
  proposalTemplateWords,
  provenanceWords,
  sectionWords,
  settingsSavedLine,
} from '@heliogrid/i18n';
import {
  ProposalTemplateSettings,
  ProvenanceWordsProvider,
  type RichTextValue,
  TEMPLATE_SAMPLE,
  type TemplateCoverCount,
  type TemplateLanguageStrip,
  type TemplatePartName,
} from '@heliogrid/ui';
import { useState } from 'react';
import { COMPANY } from '../support/proposal-template-sample';

/** The board's tenant (`SCR-M01-19`): its cover facts, its counts and who saved the template. */
const SAMPLE = {
  colour: '#0D7A4F',
  taxId: '27AABCS1429P1ZQ',
  address: 'Shop 14, Laxmi Complex, Baner Road, Pune 411045',
  about:
    'Suryodaya Solar has designed and installed rooftop solar across Pune and Nashik since 2011 — homes, housing societies and small factories.',
  counts: { totalCapacityInstalledKw: 1840, happyCustomers: 620, citiesServed: 14 },
  changer: 'Rajesh Kulkarni',
  changedOn: '2026-08-28',
  docDate: '2026-08-30',
  bank: 'HDFC Bank',
  /* m19-a … m19-e: Performance and Components left out. */
  off: ['performance', 'components'] as readonly ProposalSection[],
} as const;

const NO_COUNTS: Record<TemplateCoverCount, number | null> = {
  totalCapacityInstalledKw: null,
  happyCustomers: null,
  citiesServed: null,
};

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/** Domain's terms are read-only lists; the editor's value is its own copy of them. */
function editable(language: UiLanguage): RichTextValue {
  const value = DEFAULT_TERMS[language] ?? DEFAULT_TERMS.en;
  return {
    version: 1,
    blocks: value.blocks.flatMap((block) =>
      block.type === 'p' || block.type === 'h'
        ? [{ type: block.type, spans: block.spans.map((span) => ({ ...span })) }]
        : [],
    ),
  };
}

/**
 * The Proposal template page as a screen holds it (`SCR-M01-19`): the part, the sections and the
 * phases' order live here, in the browser; every word is the real catalog's in the reader's
 * language, built while the page renders — the words hold functions, so they cannot come through
 * `mount`.
 */
export function ProposalTemplateAsHeld({
  reader,
  part: partAtStart = 'cover',
  neverSaved = false,
  loading = false,
  unsaved = false,
  held = unsaved,
  saveFailed = false,
  atCap = false,
  titled = false,
}: {
  reader: UiLanguage;
  part?: TemplatePartName;
  /** Every part is HelioGrid's: no standing line, the teaching banner, the source lines. */
  neverSaved?: boolean;
  loading?: boolean;
  /** The template record differs from the saved one: the stage's note. */
  unsaved?: boolean;
  /** A change is held — the act bar; a phase move holds one with no note. */
  held?: boolean;
  saveFailed?: boolean;
  /** The timeline holds its twenty phases. */
  atCap?: boolean;
  titled?: boolean;
}) {
  const { t } = READERS[reader];
  const words = proposalTemplateWords(t);
  const [part, setPart] = useState(partAtStart);
  const [off, setOff] = useState<readonly ProposalSection[]>(neverSaved ? [] : SAMPLE.off);
  const phaseCount = atCap ? TIMELINE_PHASE_LIMIT : neverSaved ? DEFAULT_TIMELINE_PHASES.length : 6;
  const [phases, setPhases] = useState(() =>
    Array.from({ length: phaseCount }, (_, key) => {
      const phase = DEFAULT_TIMELINE_PHASES[key % DEFAULT_TIMELINE_PHASES.length];
      return {
        key,
        title: phase?.name[reader] ?? phase?.name.en ?? '',
        note: phase?.description[reader] ?? phase?.description.en ?? '',
      };
    }),
  );
  const [pressed, setPressed] = useState<readonly string[]>([]);
  const press = (what: string) => setPressed((list) => [...list, what]);
  const origin = neverSaved ? 'platform' : 'own';
  const sectionWord = sectionWords(t, phases.length);
  const rows = PROPOSAL_SECTIONS.map((key) => ({
    key,
    ...sectionWord(key),
    on: !off.includes(key),
    floor: isSectionFloor(key),
  }));
  const optional = rows.filter((row) => !row.floor);
  const strip = (authored: readonly UiLanguage[]): TemplateLanguageStrip => ({
    languages: UI_LANGUAGES.map((code) => ({
      code,
      label: languageName(code),
      state: authored.includes(code) ? 'authored' : 'empty',
    })),
    value: 'en',
    onChange: (code) => press(`language:${code}`),
  });
  const date = (iso: string) => formatDate(IN_PACK.formats, Date.parse(iso), reader);
  const standing = neverSaved
    ? null
    : settingsSavedLine(
        t,
        { kind: 'saved', at: Date.parse(SAMPLE.changedOn), name: SAMPLE.changer },
        { date: (epochMs) => formatDate(IN_PACK.formats, epochMs, reader) },
      );
  const terms = editable('en');
  return (
    <ProvenanceWordsProvider value={provenanceWords(t)}>
      {/* The shell's gutter, as the app's page sits in it: the page leaves its sides to the shell. */}
      <div lang={reader} style={{ padding: '0 var(--screen-pad-mobile)' }}>
        <ProposalTemplateSettings
          words={words}
          loading={loading}
          {...(titled ? { title: words.title } : {})}
          {...(standing === null ? {} : { standing })}
          part={part}
          onPart={setPart}
          document={{
            facts: {
              companyName: COMPANY,
              taxId: SAMPLE.taxId,
              taxIdLabel: IN_PACK.formats.taxIdLabel,
              address: SAMPLE.address,
              letterhead: {},
            },
            colour: SAMPLE.colour,
            sections: optional.map((row) => ({ label: row.title, included: row.on })),
            terms,
            docNumber: TEMPLATE_SAMPLE.docNumber,
            docDate: date(SAMPLE.docDate),
          }}
          unsaved={unsaved}
          held={held}
          teaching={neverSaved}
          onWriteOwn={(written) => press(`write-own:${written}`)}
          cover={{
            origin,
            strip: strip(['en']),
            about: neverSaved ? '' : SAMPLE.about,
            onAbout: () => press('about'),
            counts: neverSaved ? NO_COUNTS : SAMPLE.counts,
            onCount: (count) => press(`count:${count}`),
          }}
          sections={{
            origin,
            rows,
            printing: optional.filter((row) => row.on).length,
            of: optional.length,
            onToggle: (key) =>
              setOff((list) =>
                list.includes(key as ProposalSection)
                  ? list.filter((each) => each !== key)
                  : [...list, key as ProposalSection],
              ),
          }}
          terms={{
            origin,
            strip: strip(['en', 'hi']),
            languageName: languageName('en'),
            value: terms,
            onChange: () => press('terms'),
          }}
          timeline={{
            origin,
            phases,
            atCap,
            onMove: (from, to) =>
              setPhases((list) => {
                const next = [...list];
                const [moved] = next.splice(from, 1);
                if (moved !== undefined) next.splice(to, 0, moved);
                return next;
              }),
            onDelete: (key) => press(`delete:${key}`),
            onEdit: (key) => press(`edit:${key}`),
            onAdd: () => press('add'),
          }}
          bankLine={words.bankFrom(SAMPLE.bank)}
          onOpenBranding={() => press('branding')}
          onOpenProfile={() => press('profile')}
          onOpenFullSize={() => press('full-size')}
          saveFailed={saveFailed}
          {...(held
            ? {
                act: {
                  saving: false,
                  onSave: () => press('save'),
                  onDiscard: () => press('discard'),
                },
              }
            : {})}
        />
        {/* Read by a spec, never drawn: a long report would widen the page it measures. */}
        <div hidden>
          <output data-testid="pressed">{pressed.join('|')}</output>
        </div>
      </div>
    </ProvenanceWordsProvider>
  );
}
