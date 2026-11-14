import type { ReactNode } from 'react';

/**
 * The proposal's own pictures, one platform set in one style (`M06-51`): four a company may put on
 * its cover — `home`, `villa`, `factory`, `society` — and five the document dresses its pages with.
 * A picture is decoration and carries no fact, so it has no words of its own and a screen reader
 * passes it by.
 */
export const PROPOSAL_PICTURE_NAMES = [
  'home',
  'villa',
  'factory',
  'society',
  'site',
  'roof',
  'dusk',
  'panels',
  'evening',
] as const;
export type ProposalPictureName = (typeof PROPOSAL_PICTURE_NAMES)[number];

/**
 * The shade words on a picture sit on, so they keep WCAG AA whatever the picture holds: `cover`
 * darkens the head a little and the foot fully (a cover, a hero); `foot` darkens the foot alone (a
 * closing card); `none` for a picture that holds no words.
 */
export type ProposalPictureShade = 'none' | 'cover' | 'foot';

export interface ProposalPictureProps {
  /** One of the platform's pictures. */
  name?: ProposalPictureName;
  /** A company's own photo, by address. It wins over `name`. */
  src?: string;
  shade?: ProposalPictureShade;
  /** What is drawn over the picture — its words, in the picture's fixed white ink. */
  children?: ReactNode;
}
