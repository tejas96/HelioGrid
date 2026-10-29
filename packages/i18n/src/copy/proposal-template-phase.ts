import type { TranslatedText } from '@heliogrid/contracts';
/**
 * The Proposal template's field refusals and the phase editor's words (`SCR-M01-19` m19-g): its
 * heading, its act and each field's refusal. The page's other words are `proposal-template.ts`'s.
 */
import { PHASE_NAME_LIMIT, type TemplateRefusal, type UiLanguage } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { TEMPLATE } from './proposal-template';

type T = Translator['t'];

/**
 * The phase editor's heading (m19-g): a new phase is *New phase*, last of one more; a held phase
 * is its own name in the reader's language where written, else English (`F3-10`), at its place.
 */
function phaseEditorHeading(
  t: T,
  phase: {
    readonly adding: boolean;
    readonly name: Readonly<Partial<Record<UiLanguage, string>>> & { readonly en: string };
    readonly position: number;
    readonly count: number;
  },
  reader: UiLanguage,
): { readonly title: string; readonly subtitle: TranslatedText } {
  if (phase.adding) {
    return {
      title: t(TEMPLATE.newPhase),
      subtitle: t(TEMPLATE.phaseOf, { position: phase.count + 1, count: phase.count + 1 }),
    };
  }
  return {
    title: phase.name[reader] ?? phase.name.en,
    subtitle: t(TEMPLATE.phaseOf, { position: phase.position, count: phase.count }),
  };
}

/** A field's refusal in words. */
export function templateRefusalWords(
  t: T,
  field: 'name' | 'what' | 'terms' | 'about',
  refusal: TemplateRefusal | null,
): TranslatedText | null {
  if (refusal === null) return null;
  if (refusal === 'too-long') return t(TEMPLATE.nameTooLong, { count: PHASE_NAME_LIMIT });
  const words = {
    name: TEMPLATE.nameNeeded,
    what: TEMPLATE.whatNeeded,
    terms: TEMPLATE.termsNeedEnglish,
    about: TEMPLATE.aboutNeedsEnglish,
  } as const;
  return t(words[field]);
}

/** The terms' and the about text's refusals, each present only when its field refuses. */
export function templateFieldRefusals(
  t: T,
  refusals: { readonly terms: TemplateRefusal | null; readonly about: TemplateRefusal | null },
): { readonly termsError?: TranslatedText; readonly aboutError?: TranslatedText } {
  const terms = templateRefusalWords(t, 'terms', refusals.terms);
  const about = templateRefusalWords(t, 'about', refusals.about);
  return {
    ...(terms === null ? {} : { termsError: terms }),
    ...(about === null ? {} : { aboutError: about }),
  };
}

/**
 * The phase editor's words for the phase it holds (m19-g): its heading, its act — *Add phase* for a
 * new one — and each field's refusal once the person tried to save it.
 */
export function phaseEditorWords(
  t: T,
  phase: {
    readonly adding: boolean;
    readonly name: Readonly<Partial<Record<UiLanguage, string>>> & { readonly en: string };
    readonly position: number;
    readonly count: number;
    readonly shown: {
      readonly name: TemplateRefusal | null;
      readonly description: TemplateRefusal | null;
    };
  },
  reader: UiLanguage,
): {
  /** *New phase*, or the phase's name as the company wrote it. */
  readonly title: string;
  readonly subtitle: TranslatedText;
  readonly act: TranslatedText;
  readonly nameError?: TranslatedText;
  readonly whatError?: TranslatedText;
} {
  const nameError = templateRefusalWords(t, 'name', phase.shown.name);
  const whatError = templateRefusalWords(t, 'what', phase.shown.description);
  return {
    ...phaseEditorHeading(t, phase, reader),
    act: t(phase.adding ? TEMPLATE.addPhaseAct : TEMPLATE.savePhase),
    ...(nameError === null ? {} : { nameError }),
    ...(whatError === null ? {} : { whatError }),
  };
}
