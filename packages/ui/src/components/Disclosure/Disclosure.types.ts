import type { ReactNode } from 'react';

/**
 * The four ruled kinds. Each owns its wording; `custom` is the only one whose `text` is read.
 *
 * - `indicative-basis` — `M06-04` (P0) / `SCR-M06-17`, the Path B line on every document.
 * - `remote-survey` — the basis line when nobody stood on the roof.
 * - `structure` — `MS9-17`, wherever structure or mounting is quoted.
 * - `staleness` — `MS9-16`, and the one that prints even inside a print-suppressed region.
 */
export type DisclosureKind =
  | 'indicative-basis'
  | 'remote-survey'
  | 'structure'
  | 'staleness'
  | 'custom';

/**
 * **The mandatory honesty line, in the reading flow, at the weight of the figures it qualifies.**
 *
 * **It has no dismiss, no `open`, no `onDismiss` and no `dismissible`.** There is nothing to close,
 * so no caller has to remember not to close it — the difference between this and `Banner`, where
 * `dismissible` is opt-in and `NEVER_DISMISSIBLE` is a guard that `disclaimer` was never on.
 *
 * **The words are the component's.** "Verbatim" is only true if one place owns the line, so `text`
 * is ignored (with a console warning) for the four ruled kinds and particulars go in `detail`.
 */
export interface DisclosureSpec {
  kind: DisclosureKind;
  /** Read **only** for `kind="custom"` — a market pack's own required line. */
  text?: string;
  /** The particulars: which figures, whose survey, as of when. Never a replacement for the line. */
  detail?: string;
  /**
   * `screen` (default) — `--fs-body-lg` (17px) with a 700 lead clause, at or above every run of
   * prose around it, so the default surface is already in the reading flow (`F5-37`).
   * `document` — the lead clause at `--doc-fs-figure` (22px = 16.5pt, **the money figure's own
   * size**) and the sentence at `--doc-fs` (12pt reading copy).
   */
  surface?: 'screen' | 'document';
}

export type DisclosureProps = DisclosureSpec;

/**
 * **Every true line, always, in document order** — basis · remote survey · structure · staleness.
 *
 * The deliberate opposite of `BannerStack`: **no `mode`, no `max`**, no precedence rule that lets
 * one statement speak for the others. It orders and de-duplicates, and that is the whole API.
 */
export interface DisclosureSetProps {
  /** Kinds or specs. Order and duplicates don't matter — the set fixes both. */
  items?: (DisclosureKind | DisclosureSpec)[];
  surface?: 'screen' | 'document';
  gap?: number;
}

/** One ruled line: the 700 lead clause, the verbatim sentence, and what the line is about. */
export interface DisclosureLine {
  lead: string;
  line: string;
  subject: string;
}

/** What every `disclosure` / `disclaimer` host prop runs through. */
export type DisclosureInput = DisclosureKind | DisclosureSpec | ReactNode;
