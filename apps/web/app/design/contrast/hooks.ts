'use client';
import { useEffect, useState } from 'react';

/**
 * Logic half of the contrast comparison (CLAUDE.md: design and logic in different files).
 *
 * Ratios are MEASURED from the rendered DOM, never taken from a table someone typed. That
 * matters here: the whole point of the page is to decide with evidence, and a hard-coded
 * number would just be my arithmetic re-displayed. Reading computed styles also means the
 * proposed column is measured through the same cascade the real app would use.
 */

/** One measured pair, as reported by the live DOM. */
export interface Measured {
  label: string;
  ratio: number | null;
  floor: number;
}

const relativeLuminance = (rgb: [number, number, number]): number => {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
};

/**
 * Computed colours arrive in two shapes and they are NOT on the same scale:
 *   rgb(229, 72, 77)                      → 0–255 channels
 *   color(srgb 0.826196 0.259765 0.2778)  → 0–1 channels, what Chrome returns for color-mix()
 * Reading the second as 0–255 makes every mixed colour collapse to near-black — the proposed
 * columns read a nonsense 20.95:1 until this was fixed. Scale by the notation, not by hope.
 */
const parseRgb = (value: string): [number, number, number] | null => {
  const nums = value.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return null;
  const scale = value.trimStart().startsWith('color(') ? 255 : 1;
  return [Number(nums[0]) * scale, Number(nums[1]) * scale, Number(nums[2]) * scale];
};

const isTransparent = (value: string): boolean => {
  const nums = value.match(/[\d.]+/g);
  return value === 'transparent' || (nums?.length === 4 && Number(nums[3]) === 0);
};

/**
 * The background a user actually sees behind this text: CSS backgrounds are not inherited,
 * so a transparent element sits on its nearest painted ancestor. Walking up is exactly the
 * cross-rule resolution the tokens coverage gate cannot do statically — see docs/13
 * UXG-A11Y-03, which was found by hand for that reason.
 */
const effectiveBackground = (el: Element): [number, number, number] | null => {
  let node: Element | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (!isTransparent(bg)) return parseRgb(bg);
    node = node.parentElement;
  }
  return null;
};

const ratioOf = (el: Element | null): number | null => {
  if (!el) return null;
  const fg = parseRgb(getComputedStyle(el).color);
  const bg = effectiveBackground(el);
  if (!fg || !bg) return null;
  const [hi, lo] = [relativeLuminance(fg), relativeLuminance(bg)].sort((a, b) => b - a);
  return ((hi as number) + 0.05) / ((lo as number) + 0.05);
};

/** Selector → label + the floor WCAG demands for that role, per column. */
const PROBES: { selector: string; label: string; floor: number }[] = [
  { selector: '.ui-btn[data-variant="destructive"]', label: 'white on danger fill', floor: 4.5 },
  { selector: '.cmp-danger-text', label: 'danger text on white', floor: 4.5 },
  { selector: '.cmp-sunken .cmp-secondary-text', label: 'secondary on sunken', floor: 4.5 },
];

const toHex = (rgb: [number, number, number]): string =>
  `#${rgb
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;

/** The resolved value of a token, read off its swatch — never a literal typed into the page. */
const swatchValue = (root: HTMLElement, selector: string): string => {
  const el = root.querySelector(selector);
  if (!el) return '—';
  const rgb = parseRgb(getComputedStyle(el).backgroundColor);
  return rgb ? toHex(rgb) : '—';
};

export interface Measurements {
  pairs: Measured[];
  danger: string;
  secondary: string;
}

export function useContrastMeasurements(
  scopeRef: React.RefObject<HTMLElement | null>,
): Measurements {
  const [state, setState] = useState<Measurements>({ pairs: [], danger: '—', secondary: '—' });

  useEffect(() => {
    const root = scopeRef.current;
    if (!root) return;
    // A frame after paint: color-mix on a custom property resolves during style computation,
    // and reading in the same tick can catch the pre-cascade value.
    const id = requestAnimationFrame(() => {
      setState({
        pairs: PROBES.map((p) => ({
          label: p.label,
          floor: p.floor,
          ratio: ratioOf(root.querySelector(p.selector)),
        })),
        danger: swatchValue(root, '.cmp-swatch-danger'),
        secondary: swatchValue(root, '.cmp-swatch-secondary'),
      });
    });
    return () => cancelAnimationFrame(id);
  }, [scopeRef]);

  return state;
}
