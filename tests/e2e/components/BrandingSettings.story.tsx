import {
  COMPANY_LOGO_LIMITS,
  companyLogoRefusal,
  formatDate,
  IN_PACK,
  type SettingsStanding,
  type UiLanguage,
} from '@heliogrid/domain';
import {
  brandingPageWords,
  brandingWords,
  createTranslator,
  settingsRowName,
} from '@heliogrid/i18n';
import {
  type BrandingDocumentFacts,
  type BrandingPart,
  type BrandingPreview,
  BrandingSettings,
} from '@heliogrid/ui';
import { useState } from 'react';
import { REFUSED_IMAGE } from '../support/company-logo';

/** The board's tenant (`SCR-M01-18`): what its cover prints, and its letterhead at three lengths. */
const SAMPLE = {
  colour: '#0D7A4F',
  taxId: '27AABCS1429P1ZQ',
  address: 'Shop 14, Laxmi Complex, Baner Road, Pune 411045',
  changer: 'Rajesh Kulkarni',
  changedOn: '2026-08-12',
  fields: {
    empty: { tagline: '', lines: '', footerNote: '' },
    short: {
      tagline: 'Rooftop solar since 2011',
      lines: '+91 98200 41123\nsuryodayasolar.in',
      footerNote: 'Thank you for choosing Suryodaya Solar.',
    },
    long: {
      tagline: 'Rooftop, ground-mount and C&I solar since 2011',
      lines: [
        '+91 98200 41123',
        '+91 20 2567 8800',
        'hello@suryodayasolar.in',
        'suryodayasolar.in',
        'MSME UDYAM-MH-26-0041982',
        'Mon–Sat, 9 am to 7 pm',
      ].join('\n'),
      footerNote: 'Thank you for choosing Suryodaya Solar.',
    },
  },
} as const;

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * The Branding page as a screen holds it (`SCR-M01-18`): the part, the preview, the colour and the
 * letterhead live here, in the browser; every word is the real catalog's in the reader's language,
 * built while the page renders — the words hold functions the colour field calls, so they cannot
 * come through `mount`.
 */
export function BrandingAsHeld({
  reader,
  companyName,
  logoSrc,
  standing = 'saved',
  loading = false,
  preview: previewAtStart = 'proposal',
  part: partAtStart = 'logo',
  colour: colourAtStart = SAMPLE.colour,
  letterhead = 'short',
  unsaved = false,
  saveFailed = false,
  refusedFile,
  titled = false,
}: {
  reader: UiLanguage;
  /** The tenant's name, which the spec's words name too (the logo's alt). */
  companyName: string;
  /** The held logo as an image address; absent, the company has none. */
  logoSrc?: string;
  standing?: 'saved' | 'never-set';
  loading?: boolean;
  preview?: BrandingPreview;
  part?: BrandingPart;
  colour?: string | null;
  letterhead?: keyof typeof SAMPLE.fields;
  /** A change is held: the stage's note and the act bar. */
  unsaved?: boolean;
  saveFailed?: boolean;
  /** The file the last choice declined as too large and too narrow (s18-p). */
  refusedFile?: string;
  /** The page draws its own title, as the web does. */
  titled?: boolean;
}) {
  const [preview, setPreview] = useState(previewAtStart);
  const [part, setPart] = useState(partAtStart);
  const [colour, setColour] = useState(colourAtStart);
  const [fields, setFields] = useState<{ tagline: string; lines: string; footerNote: string }>(
    SAMPLE.fields[letterhead],
  );
  const [pressed, setPressed] = useState<readonly string[]>([]);
  const press = (what: string) => setPressed((list) => [...list, what]);
  const { t } = READERS[reader];
  const taxLabel = IN_PACK.formats.taxIdLabel;
  const words = brandingWords(t, {
    limits: COMPANY_LOGO_LIMITS,
    companyName,
    taxLabel,
  });
  const standingFact: SettingsStanding =
    standing === 'never-set'
      ? { kind: 'never-set' }
      : { kind: 'saved', at: Date.parse(SAMPLE.changedOn), name: SAMPLE.changer };
  const { fieldErrors, ...said } = brandingPageWords(
    t,
    {
      status: saveFailed ? 'save-failed' : 'ready',
      standing: loading ? null : standingFact,
      logo: {
        refusal:
          refusedFile === undefined ? null : companyLogoRefusal(REFUSED_IMAGE, COMPANY_LOGO_LIMITS),
      },
      chosenName: refusedFile ?? null,
      draft: fields,
      saveFailure: null,
    },
    { date: (epochMs) => formatDate(IN_PACK.formats, epochMs, reader) },
  );
  const document: BrandingDocumentFacts = {
    companyName,
    taxId: SAMPLE.taxId,
    taxIdLabel: taxLabel,
    address: SAMPLE.address,
    ...(logoSrc === undefined ? {} : { logoSrc }),
    letterhead:
      standing === 'never-set'
        ? {}
        : {
            tagline: fields.tagline,
            lines: fields.lines.split('\n').filter((line) => line !== ''),
            footerNote: fields.footerNote,
          },
  };
  return (
    <div lang={reader}>
      <BrandingSettings
        words={words}
        loading={loading}
        {...(titled ? { title: settingsRowName(t, 'branding') } : {})}
        {...said}
        preview={preview}
        onPreview={setPreview}
        part={part}
        onPart={setPart}
        document={document}
        unsaved={unsaved}
        onRetry={() => press('retry')}
        onChooseLogo={(picked) => press(`chose:${picked.name}`)}
        onRemoveLogo={() => press('remove')}
        colour={colour}
        onColour={setColour}
        letterheadFields={{
          ...fields,
          ...fieldErrors,
          onTagline: (tagline) => setFields((held) => ({ ...held, tagline })),
          onLines: (lines) => setFields((held) => ({ ...held, lines })),
          onFooterNote: (footerNote) => setFields((held) => ({ ...held, footerNote })),
        }}
        onOpenFullSize={() => press('full-size')}
        onOpenProfile={() => press('profile')}
        {...(unsaved
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
        <output data-testid="preview">{preview}</output>
        <output data-testid="part">{part}</output>
      </div>
    </div>
  );
}
