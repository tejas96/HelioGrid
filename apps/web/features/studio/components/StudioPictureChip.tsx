'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioPicture } from '@heliogrid/data/react';
import type { PictureChoice } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, ShellGlyph } from '@heliogrid/ui';
import { useEffect, useId, useRef } from 'react';

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
  source: TranslatedText | null;
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

/**
 * The picture chip, top left: which picture the ground shows, who gave it, how sharp it is and its
 * credit line — always in view, never under a panel. A tap opens the three pictures: the sky
 * picture (picked by itself), your own (coming soon) or none.
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
}) {
  const setOpen = onOpen;
  const holder = useRef<HTMLDivElement>(null);
  const list = useId();
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!holder.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  const sky = picture.kind === 'sky' ? picture : null;
  const title =
    shown === 'none' ? words.noPicture : shown === 'own' ? words.yourPicture : words.skyPicture;
  const options: readonly PictureOption[] = [
    {
      choice: 'sky',
      glyph: 'image',
      title: words.skyPicture,
      line: sharpness === null ? words.skyLoading : words.skyLine(sharpness, takenOn),
      off: null,
    },
    {
      choice: 'own',
      glyph: 'camera',
      title: words.yourPicture,
      line: words.yourLine,
      off: words.yourComing,
    },
    { choice: 'none', glyph: 'grid', title: words.noPicture, line: words.noLine, off: null },
  ];
  const thumb = sky?.pieces[Math.floor(sky.pieces.length / 2)]?.image ?? null;

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
          {thumb === null || shown !== 'sky' ? (
            <ShellGlyph name="image-off" size="sm" />
          ) : (
            // A data picture fetched for this opening: there is no file to hand an image loader.
            // biome-ignore lint/performance/noImgElement: the picture lives in memory alone.
            <img src={thumb} alt="" />
          )}
        </span>
        <span className="hg-studio-chip-words">
          <ChipTitle
            title={title}
            source={sky === null || shown !== 'sky' ? null : words.source(sky.source)}
            drawnOn={shown === 'sky' ? drawnOn : null}
            canPick={canPick}
          />
          {sky === null || shown !== 'sky' ? null : (
            <span className="hg-studio-chip-credit">{sky.credit}</span>
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
                onPick(option.choice);
                setOpen(false);
              }}
            >
              <ShellGlyph name={option.glyph} size="md" />
              <span className="hg-studio-picker-words">
                <span className="hg-studio-picker-title">{option.title}</span>
                <span className="hg-studio-picker-line">{option.off ?? option.line}</span>
              </span>
            </Pressable>
          ))}
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
export function StudioPictureCredit({ picture }: { picture: StudioPicture }) {
  return picture.kind === 'sky' ? (
    <div className="hg-studio-picture">
      <p className="hg-studio-glass hg-studio-credit-only">{picture.credit}</p>
    </div>
  ) : null;
}
