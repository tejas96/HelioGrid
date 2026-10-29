import type { BlockProps } from '../Block/Block.types';
import type { HomeBlock, HomeBlocksProps } from './HomeBlocks.types';

/** One block's props, the same on both halves: its preset's overline and the region's one state. */
export function homeBlockProps(region: HomeBlocksProps, block: HomeBlock): BlockProps {
  /* A ready shell teaches: no module fills its block yet. */
  const read = region.read.kind === 'ready' ? { kind: 'empty' as const } : region.read;
  return {
    overline: block.overline,
    read,
    loadingLabel: region.loadingLabel,
    emptyTitle: region.emptyTitle,
    emptyMessage: region.emptyMessage,
    errorTitle: region.errorTitle,
    errorMessage: region.errorMessage,
    retryLabel: region.retryLabel,
  };
}
