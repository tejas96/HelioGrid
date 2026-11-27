'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioPicture } from '@heliogrid/data/react';
import type { PictureChoice } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, ShellGlyph } from '@heliogrid/ui';
import { type ReactNode, useCallback, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRadioPanel } from '../hooks/use-radio-panel';
import { StudioPanelHead } from './StudioPanelHead';

/** On a phone the panel opens at the canvas's foot, where the thumb is; elsewhere in place. */
function Foot({ at, children }: { at: HTMLElement | null; children: ReactNode }) {
  return at === null ? children : createPortal(children, at);
}

/** A row of the panel: a picture the design keeps, or Google's straight-down picture (part g). */
type PanelChoice = PictureChoice | 'straight_down';

/** One picture to pick: its mark, its name, its line, and why it cannot be picked yet. */
interface PictureOption {
  readonly choice: PanelChoice;
  readonly glyph: 'image' | 'camera' | 'grid';
  readonly title: TranslatedText;
  readonly line: TranslatedText;
  readonly off: TranslatedText | null;
}

/** What the chip shows of the picture: its title, who gave it, its credit and its thumbnail. */
function chipFacts(
  picture: StudioPicture,
  shown: PictureChoice,
  words: StudioCanvasWords,
  ownLine: string | null,
  straightOn: boolean,
) {
  const sky = picture.kind === 'sky' ? picture : null;
  const own = picture.kind === 'own' ? picture : null;
  const ownTitle = own === null ? words.yourPicture : words.ownTitle(own.pictureKind);
  const skyTitle = straightOn ? words.siteStraightDown : words.skyPicture;
  const title = shown === 'none' ? words.noPicture : shown === 'own' ? ownTitle : skyTitle;
  const pieces = sky?.pieces ?? own?.pieces ?? [];
  const skySource = sky === null || shown !== 'sky' ? null : words.source(sky.source);
  return {
    title,
    source: own === null ? skySource : ownLine,
    credit: pictureCreditOf(picture, words),
    thumb: pieces[Math.floor(pieces.length / 2)]?.image ?? null,
  };
}

/** The button itself: the thumb, the name over its line, and the arrow while it can be pressed. */
function ChipButton({
  title,
  line,
  thumb,
  shown,
  thumbOnly,
  pickable,
  open,
  label,
  onPress,
}: {
  title: TranslatedText;
  line: string | null;
  thumb: string | null;
  shown: PictureChoice;
  thumbOnly: boolean;
  pickable: boolean;
  open: boolean;
  label: TranslatedText;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="hg-studio-chip"
      data-thumb={thumbOnly}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: open }}
      disabled={!pickable}
      onPress={onPress}
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
      {thumbOnly ? null : (
        <span className="hg-studio-chip-words">
          <span className="hg-studio-chip-title">{title}</span>
          {line === null ? null : <span className="hg-studio-chip-source">{line}</span>}
        </span>
      )}
      {pickable ? <ShellGlyph name="chevron" size="xs" tone="current" /> : null}
    </Pressable>
  );
}

/** The pictures the panel offers: the sky picture, Google's straight-down one where offered, yours, none. */
function optionsOf(
  sharpness: string | null,
  takenOn: string | null,
  words: StudioCanvasWords,
  straight: StraightDown | null,
): readonly PictureOption[] {
  const skyLine =
    sharpness === null
      ? words.skyLoading
      : takenOn === null
        ? words.siteSkyUndated(words.source('google'), sharpness)
        : words.skyLine(sharpness, takenOn);
  return [
    { choice: 'sky', glyph: 'image', title: words.skyPicture, line: skyLine, off: null },
    ...(straight === null
      ? []
      : [
          {
            choice: 'straight_down' as const,
            glyph: 'image' as const,
            title: words.siteStraightDown,
            line: straight.line,
            off: null,
          },
        ]),
    { choice: 'own', glyph: 'camera', title: words.yourPicture, line: words.yourLine, off: null },
    { choice: 'none', glyph: 'grid', title: words.noPicture, line: words.noLine, off: null },
  ];
}

/** Google's straight-down picture as the panel offers it (`T-M05-002`, part g). */
export interface StraightDown {
  /** Its line: who gave it, its sharpness and date, what it is for. */
  readonly line: TranslatedText;
  /** It shows in place of the sky picture now. */
  readonly on: boolean;
  readonly onPick: (on: boolean) => void;
}

/** The line under the picture's name: who gave it, with how sharp it is or the day it was taken. */
function lineOf(
  source: string | null,
  detail: string | null,
  shown: PictureChoice,
  words: StudioCanvasWords,
): string | null {
  if (shown === 'none') return words.noLine;
  if (source === null || detail === null || shown === 'own') return source;
  return words.pictureLine(source, detail);
}

/**
 * The picture button, at the head's start, straight on the map: its thumb, which picture the ground
 * shows, who gave it and how sharp it is, and the arrow; its thumb alone while a job is in hand. A
 * tap opens the picture panel, whose last line is the provider's credit, under its title
 * row with its × (at the foot on a phone): the three pictures — the sky
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
  dataCredits,
  straight,
  foot,
  thumbOnly,
  hidden,
}: {
  /** A job is in hand: the thumb alone, which cannot be pressed. */
  thumbOnly: boolean;
  /** The 3D view: the picture is the top view's, and steps aside (`T-M05-002g`). */
  hidden: boolean;
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
  /** The site data's credits, beside the picture's at the foot, never covered. */
  dataCredits: readonly TranslatedText[];
  /** Google's straight-down picture, where its height data holds one; `null` where not. */
  straight: StraightDown | null;
  /** On a phone, the canvas's foot, where the pictures open; `null` under the chip. */
  foot: HTMLElement | null;
}) {
  const setOpen = onOpen;
  const holder = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useCallback(() => setOpen(false), [setOpen]);
  useRadioPanel(menu, open, close, holder, '.hg-studio-chip');
  const { title, source, credit, thumb } = chipFacts(
    picture,
    shown,
    words,
    ownLine,
    straight?.on === true,
  );
  const line = lineOf(source, shown === 'sky' ? (drawnOn ?? sharpness) : null, shown, words);
  const pickable = canPick && !thumbOnly;
  const options = optionsOf(sharpness, takenOn, words, straight);
  const creditLine = [...(credit === null || shown === 'none' ? [] : [credit]), ...dataCredits];
  const checked = (choice: PanelChoice) =>
    straight?.on === true && shown === 'sky' ? choice === 'straight_down' : choice === shown;

  return (
    <div
      ref={holder}
      className="hg-studio-picture hg-studio-head-part"
      data-hidden={hidden}
      inert={hidden}
    >
      <ChipButton
        title={title}
        line={line}
        thumb={thumb}
        shown={shown}
        thumbOnly={thumbOnly}
        pickable={pickable}
        open={open}
        label={words.pictureLabel(title)}
        onPress={() => setOpen(!open)}
      />
      {open && !thumbOnly ? (
        <Foot at={foot}>
          <div
            ref={menu}
            className="hg-studio-glass hg-studio-picker"
            data-at={foot === null ? 'chip' : 'foot'}
            role="dialog"
            aria-labelledby={titleId}
          >
            <StudioPanelHead
              id={titleId}
              title={words.picture}
              closeLabel={words.closePicture}
              onClose={close}
            />
            <div
              className="hg-studio-picker-group"
              role="radiogroup"
              aria-label={words.pictureLabel(title)}
            >
              {options.map((option) => (
                <Pressable
                  key={option.choice}
                  className="hg-studio-picker-row"
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: checked(option.choice),
                    disabled: option.off !== null,
                  }}
                  disabled={option.off !== null}
                  onPress={() => {
                    setOpen(false);
                    straight?.onPick(option.choice === 'straight_down');
                    if (option.choice === 'straight_down') return;
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
            </div>
            {planRow}
            <p className="hg-studio-picker-guide">{words.pictureGuide}</p>
            {creditLine.length === 0 ? null : (
              <p className="hg-studio-picker-credit">{creditLine.join(' · ')}</p>
            )}
          </div>
        </Foot>
      ) : null}
    </div>
  );
}

/** The picture's credit line: the provider's, or your file's name and whose it is. */
export function pictureCreditOf(picture: StudioPicture, words: StudioCanvasWords): string | null {
  if (picture.kind === 'sky') return picture.credit;
  return picture.kind === 'own' ? words.ownCredit(picture.name) : null;
}
