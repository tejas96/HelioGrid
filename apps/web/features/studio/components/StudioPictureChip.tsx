'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioPicture } from '@heliogrid/data/react';
import type { PictureChoice } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, ShellGlyph } from '@heliogrid/ui';
import { type ReactNode, useEffect, useId, useRef } from 'react';

/** One picture to pick: its mark, its name, its line, and why it cannot be picked yet. */
interface PictureOption {
  readonly choice: PictureChoice;
  readonly glyph: 'image' | 'camera' | 'grid';
  readonly title: TranslatedText;
  readonly line: TranslatedText;
  readonly off: TranslatedText | null;
}

/** The chip's title line: the picture, who gave it, and the date the roof was drawn on it. */
function ChipTitle({
  title,
  source,
  drawnOn,
  canPick,
}: {
  title: TranslatedText;
  source: string | null;
  drawnOn: string | null;
  canPick: boolean;
}) {
  return (
    <span className="hg-studio-chip-title">
      {title}
      {source === null ? null : <span className="hg-studio-chip-source"> · {source}</span>}
      {drawnOn === null ? null : <span className="hg-studio-chip-source"> · {drawnOn}</span>}
      {canPick ? <ShellGlyph name="chevron" size="xs" /> : null}
    </span>
  );
}

/** What the chip shows of the picture: its title, who gave it, its credit and its thumbnail. */
function chipFacts(
  picture: StudioPicture,
  shown: PictureChoice,
  words: StudioCanvasWords,
  ownLine: string | null,
) {
  const sky = picture.kind === 'sky' ? picture : null;
  const own = picture.kind === 'own' ? picture : null;
  const ownTitle = own === null ? words.yourPicture : words.ownTitle(own.pictureKind);
  const title = shown === 'none' ? words.noPicture : shown === 'own' ? ownTitle : words.skyPicture;
  const pieces = sky?.pieces ?? own?.pieces ?? [];
  const skySource = sky === null || shown !== 'sky' ? null : words.source(sky.source);
  return {
    title,
    source: own === null ? skySource : ownLine,
    credit: pictureCreditOf(picture, words),
    thumb: pieces[Math.floor(pieces.length / 2)]?.image ?? null,
  };
}

/**
 * The picture chip, top left: which picture the ground shows, who gave it, how sharp it is and its
 * credit line — always in view, never under a panel. A tap opens the three pictures: the sky
 * picture (picked by itself), your own — a tap opens the file picker, and a newer file replaces the
 * one laid (`T-M05-002d`) — or none; and the plan's row, when a plan is laid.
 */
export function StudioPictureChip({
  picture,
  shown,
  sharpness,
  takenOn,
  drawnOn,
  words,
  canPick,
  open,
  onOpen,
  onPick,
  ownLine,
  onPickFile,
  ownLaid,
  planRow,
}: {
  picture: StudioPicture;
  /** The picture the ground shows, by the person's pick or by itself. */
  shown: PictureChoice;
  /** The sky picture's sharpness and date, already in the reader's units and the market's dates. */
  sharpness: string | null;
  takenOn: string | null;
  /**
   * The date of the picture the first roof was drawn on, in the market's dates (M04-10): the chip
   * names it once a roof stands. `null` before a roof, or when the provider gave no date.
   */
  drawnOn: string | null;
  words: StudioCanvasWords;
  canPick: boolean;
  open: boolean;
  onOpen: (open: boolean) => void;
  onPick: (choice: PictureChoice) => void;
  /** Your picture's line on the chip — its date, or a drone map's sharpness — when it is shown. */
  ownLine: string | null;
  /** Your picture opens the system's file picker. */
  onPickFile: () => void;
  /** A picture of your own is laid: Your picture shows it again before it asks for a file. */
  ownLaid: boolean;
  /** The plan's row under the pictures: its name, its page, its eye and its lock. */
  planRow: ReactNode;
}) {
  const setOpen = onOpen;
  const holder = useRef<HTMLDivElement>(null);
  const list = useId();
  useEffect(() => {
    if (!open) return;
    const radios = () =>
      Array.from(
        holder.current?.querySelectorAll<HTMLElement>('[role="radio"]:not(:disabled)') ?? [],
      );
    // The menu opens on the picture shown, as a radio group does; the arrows move between pictures.
    const checked = holder.current?.querySelector<HTMLElement>(
      '[role="radio"][aria-checked="true"]',
    );
    (checked ?? radios()[0])?.focus();
    const away = (event: PointerEvent) => {
      if (!holder.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // The Esc is the menu's: the studio's own Esc leaves the job in hand alone.
        event.preventDefault();
        setOpen(false);
        holder.current?.querySelector<HTMLElement>('.hg-studio-chip')?.focus();
        return;
      }
      const by = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (by === undefined) return;
      const all = radios();
      const at = all.indexOf(document.activeElement as HTMLElement);
      if (at === -1) return;
      event.preventDefault();
      all[(at + by + all.length) % all.length]?.focus();
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  const { title, source, credit, thumb } = chipFacts(picture, shown, words, ownLine);
  const options: readonly PictureOption[] = [
    {
      choice: 'sky',
      glyph: 'image',
      title: words.skyPicture,
      line: sharpness === null ? words.skyLoading : words.skyLine(sharpness, takenOn),
      off: null,
    },
    { choice: 'own', glyph: 'camera', title: words.yourPicture, line: words.yourLine, off: null },
    { choice: 'none', glyph: 'grid', title: words.noPicture, line: words.noLine, off: null },
  ];

  return (
    <div ref={holder} className="hg-studio-picture">
      <Pressable
        className="hg-studio-glass hg-studio-chip"
        accessibilityRole="button"
        accessibilityLabel={words.pictureLabel(title)}
        accessibilityState={{ expanded: open }}
        disabled={!canPick}
        onPress={() => setOpen(!open)}
      >
        <span className="hg-studio-chip-thumb" aria-hidden>
          {thumb === null || shown === 'none' ? (
            <ShellGlyph name="image-off" size="sm" />
          ) : (
            // The sky picture lives in memory alone, and your picture's piece behind a link that
            // lives five minutes: neither is a file to hand an image loader. Asked as the scene asks,
            // so the browser keeps one copy the ground can read too.
            // biome-ignore lint/performance/noImgElement: the picture lives in memory or a short-lived link.
            <img src={thumb} alt="" crossOrigin="anonymous" />
          )}
        </span>
        <span className="hg-studio-chip-words">
          <ChipTitle
            title={title}
            source={source}
            drawnOn={shown === 'sky' ? drawnOn : null}
            canPick={canPick}
          />
          {credit === null || shown === 'none' ? null : (
            <span className="hg-studio-chip-credit">{credit}</span>
          )}
        </span>
      </Pressable>
      {open ? (
        <div
          id={list}
          className="hg-studio-glass hg-studio-picker"
          role="radiogroup"
          aria-label={words.pictureLabel(title)}
        >
          {options.map((option) => (
            <Pressable
              key={option.choice}
              className="hg-studio-picker-row"
              accessibilityRole="radio"
              accessibilityState={{
                checked: option.choice === shown,
                disabled: option.off !== null,
              }}
              disabled={option.off !== null}
              onPress={() => {
                setOpen(false);
                // Your picture laid but put aside comes back as it was; shown, a tap picks another.
                if (option.choice === 'own' && (!ownLaid || shown === 'own')) onPickFile();
                else onPick(option.choice);
              }}
            >
              <ShellGlyph name={option.glyph} size="md" />
              <span className="hg-studio-picker-words">
                <span className="hg-studio-picker-title">{option.title}</span>
                <span className="hg-studio-picker-line">{option.off ?? option.line}</span>
              </span>
            </Pressable>
          ))}
          {planRow}
          <p className="hg-studio-picker-guide">{words.pictureGuide}</p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Focus mode's picture chip: while a job is in hand the chip steps down to the provider's credit
 * line alone, which never leaves the screen (the provider's terms). With no sky picture, nothing.
 */
export function StudioPictureCredit({
  picture,
  words,
}: {
  picture: StudioPicture;
  words: StudioCanvasWords;
}) {
  const credit = pictureCreditOf(picture, words);
  return credit === null ? null : (
    <div className="hg-studio-picture">
      <p className="hg-studio-glass hg-studio-credit-only">{credit}</p>
    </div>
  );
}

/** The picture's credit line: the provider's, or your file's name and whose it is. */
export function pictureCreditOf(picture: StudioPicture, words: StudioCanvasWords): string | null {
  if (picture.kind === 'sky') return picture.credit;
  return picture.kind === 'own' ? words.ownCredit(picture.name) : null;
}
