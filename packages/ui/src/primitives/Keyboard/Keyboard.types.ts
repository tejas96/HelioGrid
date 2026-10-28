import type { ReactNode } from 'react';

export interface KeyboardHostProps {
  children: ReactNode;
}

/**
 * A page, door or sheet body that holds fields. While the keyboard is up, the focused field and
 * the line under it stay in view above the keyboard and above `foot`, and `foot` rides on the
 * keyboard's top edge. It is the one place a phone answers the keyboard: a surface never measures
 * the keyboard or a field itself (`packages/config/biome/keyboard-in-one-place.grit`).
 */
export interface KeyboardFrameProps {
  children: ReactNode;
  /** An act bar under the content; it stays whole above the keyboard while a field is focused. */
  foot?: ReactNode;
  /** Told the foot's height each time it lays out. */
  onFootHeight?: (height: number) => void;
  /**
   * The part of the foot's height that is the device's bottom band (the home indicator). The
   * keyboard covers that band, so the foot drops it behind the keyboard instead of floating it.
   */
  footBandUnderKeyboard?: number;
  /**
   * `false`: the content holds still and the frame shrinks above the keyboard instead of scrolling
   * — a bounded door whose own part scrolls inside it.
   */
  scrolls?: boolean;
  /**
   * `true`: what holds the frame already rises above the keyboard (a sheet), so the foot stays put
   * in it and the content gets no keyboard-tall room under it.
   */
  rises?: boolean;
  /** How far the content has scrolled, each time it moves. */
  onScrollOffset?: (offset: number) => void;
  /** The child held at the top while the rest scrolls under it, by its place among the children. */
  heldChild?: number;
}
