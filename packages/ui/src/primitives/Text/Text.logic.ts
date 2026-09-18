import { type ScriptRun, type ScriptStack, splitScriptRuns } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { Children, isValidElement, type ReactNode } from 'react';
import type { TextVariant } from './Text.types';

/**
 * The type scale's script half, shared by both halves of `Text` (`F3-09`, `F3-13`, `F3-17`).
 *
 * A browser resolves a font stack per character; React Native gives one family to a whole
 * `Text`. Both halves resolve from the ONE answer here, so a mixed line is broken into the same
 * runs and given the same line box on the phone and in the browser (Law 7). Every fact is the
 * theme's, read from the bundled faces at build time — this file decides nothing and states no
 * number of its own (`M58`).
 */

const STACK: ScriptStack = theme.type.scriptStack;

const LINE_FLOOR_EM = new Map<string, number>(
  theme.type.scriptStack.map((face) => [face.family, face.lineFloorEm]),
);

/** Mono is set in the mono family, which the sans stack does not name, so no run splits. */
export function isMono(variant: TextVariant): boolean {
  return variant === 'mono';
}

/** The runs of one string: which bundled family draws each stretch of it. */
export function runsOfString(text: string): readonly ScriptRun[] {
  return splitScriptRuns(text, STACK);
}

/** The words a node carries directly; an element child renders its own text and its own box. */
function stringsIn(children: ReactNode): string[] {
  return Children.toArray(children)
    .filter((child) => !isValidElement(child))
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''));
}

/**
 * The role's line box, raised to fit the tallest face this text is drawn in.
 *
 * `F3-17` — the scale keeps its sizes, and a script whose marks sit above and below the baseline
 * takes the room its face asks for. `undefined` means the scale already fits: the brand face
 * imposes no floor, so a Latin line is drawn exactly as it was before and neither half sets
 * anything. Only a line the scale would clip is raised.
 */
export function lineHeightFor(variant: TextVariant, children: ReactNode): number | undefined {
  const role = theme.type.roles[variant === 'mono' ? 'body-sm' : variant];
  /* Mono sets the never-translated set (`F3-08`) — figures, identifiers and units, Latin in
     every language — in a family the stack does not name, so no script floor reaches it. */
  const floorEm = isMono(variant)
    ? 0
    : stringsIn(children)
        .flatMap((text) => runsOfString(text))
        .reduce((tallest, run) => Math.max(tallest, LINE_FLOOR_EM.get(run.family) ?? 0), 0);
  const floor = Math.ceil(floorEm * role.fontSize);
  const drawn = 'lineHeight' in role ? role.lineHeight : 0;
  return floor > drawn ? floor : undefined;
}
