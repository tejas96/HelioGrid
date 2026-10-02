import { theme } from '@heliogrid/theme';
import { Block } from '../Block/Block.native';
import { BlockGrid } from '../Block/BlockGrid.native';
import { homeBlockProps } from './HomeBlocks.logic';
import type { HomeBlocksProps } from './HomeBlocks.types';

/** The home's blocks — each teaching, failing or loading together, side by side where two fit. */
export function HomeBlocks(props: HomeBlocksProps) {
  return (
    <BlockGrid gap={theme.spacing['sp-6']}>
      {props.blocks.map((block) => (
        <Block key={block.key} {...homeBlockProps(props, block)} />
      ))}
    </BlockGrid>
  );
}
