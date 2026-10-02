import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';
import { Block } from '../Block/Block.native';
import { BlockGrid } from '../Block/BlockGrid.native';
import { homeBlockProps } from './HomeBlocks.logic';
import type { HomeBlocksProps } from './HomeBlocks.types';

/**
 * The home's blocks — each teaching, failing or loading together, side by side where two fit,
 * flush with the head above them as `SCR-SHELL-01` draws them: the page already pads the region.
 */
export function HomeBlocks(props: HomeBlocksProps) {
  return (
    <BlockGrid gap={theme.spacing['sp-6']}>
      {props.blocks.map((block) => (
        <Block key={block.key} {...homeBlockProps(props, block)} style={styles.flush} />
      ))}
    </BlockGrid>
  );
}

const styles = StyleSheet.create({
  flush: { padding: 0 },
});
