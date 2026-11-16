import type { ProvenanceTier as Tier, TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { ProvenanceTier } from '../Provenance';
import { RollingNumber } from '../RollingNumber';
import { aroundFigure } from './ProposalBlocks.logic';
import type { BlockFigure as Figure } from './ProposalBlocks.views';

/** A block's head: what the figure under it is, and the honesty of it — a tier, or a verdict. */
export function BlockOver({
  overline,
  tier,
  aside,
}: {
  overline: TranslatedText;
  tier?: Tier;
  aside?: ReactNode;
}) {
  return (
    <div className="hg-pb-over-row">
      <span className="hg-pb-over hg-overline">{overline}</span>
      {tier === undefined ? null : <ProvenanceTier tier={tier} />}
      {aside}
    </div>
  );
}

/** The block's one large figure, rolled into place once; the paper's is larger still. */
export function BlockFigure({
  figure,
  size = 'hero',
}: {
  figure: Figure;
  size?: 'hero' | 'display';
}) {
  return (
    <span className="hg-pb-figure" data-size={size}>
      <RollingNumber value={figure.text} variant={size} />
    </span>
  );
}

/** A sentence with its figure set in the mono face, wherever the reader's language put it. */
export function FigureLine({
  sentence,
  figure,
  quiet = false,
}: {
  sentence: string;
  figure: string;
  /** A check beside the facts, not one of them: the mono face at the line's own weight. */
  quiet?: boolean;
}) {
  const cut = aroundFigure(sentence, figure);
  return (
    <>
      {cut.lead}
      {cut.figure === '' ? null : quiet ? (
        <span className="hg-pb-mono">{cut.figure}</span>
      ) : (
        <b className="hg-pb-mono">{cut.figure}</b>
      )}
      {cut.trail}
    </>
  );
}
