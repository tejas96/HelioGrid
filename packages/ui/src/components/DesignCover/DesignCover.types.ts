import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

/**
 * **A design's cover** (`T-M05-001`): the picture of the model across a card, with one mark laid on
 * its corner. Until the studio draws a model it is a sunken field with one word — "3D preview coming
 * soon" (`.claude/rules/ui-adherence.md`, the placeholder).
 * The lead's design card and the Proposals page's 3D card draw the same one.
 */
export interface DesignCoverProps {
  /** What the cover says while it holds no picture. */
  readonly word: TranslatedText;
  /** A mark on its corner — *Recommended*, *3D* — or none. */
  readonly mark?: ReactNode;
}
