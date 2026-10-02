import { theme } from '@heliogrid/theme';
import { Block } from '../Block/Block';
import { BlockGrid } from '../Block/BlockGrid';
import { homeBlockProps } from './HomeBlocks.logic';
import type { HomeBlocksProps } from './HomeBlocks.types';

/**
 * The home's blocks — each teaching, failing or loading together, side by side where two fit,
 * flush with the head above them as `SCR-SHELL-01` draws them: the page already pads the region.
 */
export function HomeBlocks(props: HomeBlocksProps) {
  return (
    <BlockGrid className="hg-home-blocks" gap={theme.spacing['sp-6']}>
      {props.blocks.map((block) => (
        <Block key={block.key} {...homeBlockProps(props, block)} />
      ))}
    </BlockGrid>
  );
}
