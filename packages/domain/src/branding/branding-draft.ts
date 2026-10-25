import type { BrandingSettings, Letterhead } from '../commerce/effective-settings';
import type { PackLabel } from '../format/languages';
import { isHexColour, normaliseHexColour } from './hex-colour';

/**
 * The Branding page's one draft (`M01-50`, `SCR-M01-18`), which both screens render: the saved set
 * opens as text the fields hold, every edit changes the draft alone, and *Save branding* sends the
 * write this module builds. The letterhead is tenant content in `F3-10`'s per-language class; the
 * page edits the English slot every language falls back to, and keeps any other language stored.
 */

/** The longest a letterhead's parts may be — the wire's own bounds (`contracts/document-templates.ts`). */
export const LETTERHEAD_LIMITS = { tagline: 120, line: 200, lines: 6 } as const;

/** What the page reads: the branding as stored, and the profile's logo (`D237`). */
export interface BrandingSaved extends BrandingSettings {
  readonly logoFileId: string | null;
}

/** The fields as the person holds them. `brandColour` null is the platform's colour, untouched. */
export interface BrandingDraft {
  readonly brandColour: string | null;
  readonly tagline: string;
  /** The *Lines under your address* field: one line per line of text. */
  readonly lines: string;
  readonly footerNote: string;
  readonly logoFileId: string | null;
}

export type BrandingEdit =
  | { readonly kind: 'colour'; readonly value: string }
  | { readonly kind: 'tagline'; readonly value: string }
  | { readonly kind: 'lines'; readonly value: string }
  | { readonly kind: 'footerNote'; readonly value: string }
  | { readonly kind: 'logoRemoved' }
  | { readonly kind: 'logoStored'; readonly fileId: string };

/** Why a letterhead field cannot be saved as it stands; the field shows it before any save. */
export type LetterheadRefusal = 'too-many-lines' | 'too-long';

export interface BrandingDraftWrite extends BrandingSettings {
  /** Present only when the draft moved the logo: absent keeps the stored one. */
  readonly logoFileId?: string | null;
}

const english = (label: PackLabel | null | undefined): string => label?.en ?? '';

export function brandingDraftOf(saved: BrandingSaved): BrandingDraft {
  return {
    brandColour: saved.brandColour,
    tagline: english(saved.letterhead?.tagline),
    lines: (saved.letterhead?.lines ?? []).map(english).join('\n'),
    footerNote: english(saved.letterhead?.footerNote),
    logoFileId: saved.logoFileId,
  };
}

export function brandingEdit(draft: BrandingDraft, edit: BrandingEdit): BrandingDraft {
  switch (edit.kind) {
    case 'colour':
      return { ...draft, brandColour: edit.value };
    case 'tagline':
      return { ...draft, tagline: edit.value };
    case 'lines':
      return { ...draft, lines: edit.value };
    case 'footerNote':
      return { ...draft, footerNote: edit.value };
    case 'logoRemoved':
      return { ...draft, logoFileId: null };
    case 'logoStored':
      return { ...draft, logoFileId: edit.fileId };
  }
}

/** The field's text as the lines it prints: each trimmed, blank ones dropped. */
export function letterheadLinesOf(text: string): readonly string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/** The lines field's refusal, or null when it can be saved. */
export function letterheadLinesRefusal(text: string): LetterheadRefusal | null {
  const lines = letterheadLinesOf(text);
  if (lines.length > LETTERHEAD_LIMITS.lines) return 'too-many-lines';
  return lines.some((line) => line.length > LETTERHEAD_LIMITS.line) ? 'too-long' : null;
}

/** A one-line field's refusal (*Tagline*, *Note along the foot*), or null. */
export function letterheadFieldRefusal(
  field: 'tagline' | 'footerNote',
  text: string,
): LetterheadRefusal | null {
  const limit = field === 'tagline' ? LETTERHEAD_LIMITS.tagline : LETTERHEAD_LIMITS.line;
  return text.trim().length > limit ? 'too-long' : null;
}

/** The draft can be sent: a colour the derivation reads, and every letterhead field within its bounds. */
export function brandingSendable(draft: BrandingDraft): boolean {
  return (
    (draft.brandColour === null || isHexColour(draft.brandColour)) &&
    letterheadLinesRefusal(draft.lines) === null &&
    letterheadFieldRefusal('tagline', draft.tagline) === null &&
    letterheadFieldRefusal('footerNote', draft.footerNote) === null
  );
}

/** The English slot replaced, every other language kept; an empty English clears the label. */
function relabelled(stored: PackLabel | null | undefined, text: string): PackLabel | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : { ...stored, en: trimmed };
}

function letterheadOf(saved: BrandingSaved, draft: BrandingDraft): Letterhead | null {
  const stored = saved.letterhead;
  const letterhead: Letterhead = {
    tagline: relabelled(stored?.tagline, draft.tagline),
    // A line keeps its other languages only while its English is the same line, found by its
    // words: by position, a line deleted or moved would hand its neighbour's Hindi to another.
    lines: letterheadLinesOf(draft.lines).map(
      (line) => stored?.lines.find((held) => held.en === line) ?? { en: line },
    ),
    footerNote: relabelled(stored?.footerNote, draft.footerNote),
  };
  const empty =
    letterhead.tagline === null && letterhead.lines.length === 0 && letterhead.footerNote === null;
  return empty && stored === null ? null : letterhead;
}

/** The one write *Save branding* sends. */
export function brandingWriteOf(saved: BrandingSaved, draft: BrandingDraft): BrandingDraftWrite {
  const brandColour =
    draft.brandColour === null || !isHexColour(draft.brandColour)
      ? saved.brandColour
      : normaliseHexColour(draft.brandColour);
  const write = { brandColour, letterhead: letterheadOf(saved, draft) };
  return draft.logoFileId === saved.logoFileId ? write : { ...write, logoFileId: draft.logoFileId };
}

/** The draft differs from what is saved — what raises the act bar and asks before leaving. */
export function brandingChanged(saved: BrandingSaved, draft: BrandingDraft): boolean {
  const write = brandingWriteOf(saved, draft);
  if ('logoFileId' in write) return true;
  return (
    write.brandColour !== saved.brandColour ||
    canonical(write.letterhead) !== canonical(saved.letterhead)
  );
}

/** A value as text with its keys in one order, so two equal letterheads compare equal however they were built. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, held: unknown) =>
    held !== null && typeof held === 'object' && !Array.isArray(held)
      ? Object.fromEntries(Object.entries(held).sort(([a], [b]) => a.localeCompare(b)))
      : held,
  );
}

/** Who saved last, as the page's read carries it: absent from an api built before it was kept. */
export interface BrandingLastSave {
  readonly at: string;
  readonly by: { readonly name: string | null } | null;
}

/** What the standing line under the title says. */
export type BrandingStanding =
  | { readonly kind: 'saved'; readonly at: number; readonly name: string | null }
  | { readonly kind: 'saved-unknown' }
  | { readonly kind: 'never-set' };

/**
 * The standing line's state: who and when once a save is known; an api that does not say (`changed`
 * absent) reads by what is held, so a company with a colour, a letterhead or a logo is never told
 * nothing is set.
 */
export function brandingStanding(
  saved: BrandingSaved,
  changed: BrandingLastSave | null | undefined,
): BrandingStanding {
  if (changed !== undefined && changed !== null) {
    return { kind: 'saved', at: Date.parse(changed.at), name: changed.by?.name ?? null };
  }
  /* `null` is an api that keeps the last save and has none: only a logo from the profile's door is held. */
  const holdsSomething =
    changed === null
      ? saved.logoFileId !== null
      : saved.brandColour !== null || saved.letterhead !== null || saved.logoFileId !== null;
  return holdsSomething ? { kind: 'saved-unknown' } : { kind: 'never-set' };
}
