import type { ShellLoad } from '@heliogrid/domain';
import type { BlockProps } from '../Block/Block.types';
import type { HomeBlock, HomeBlocksProps } from './HomeBlocks.types';

/** A block's state for the shell's load: a loaded block teaches, since no module fills it yet. */
const BLOCK_STATE_OF_LOAD = {
  loading: 'loading',
  failed: 'error',
  ready: 'empty',
} as const satisfies Record<ShellLoad, 'loading' | 'error' | 'empty'>;

/** One block's props, the same on both halves: its preset's overline and the region's one state. */
export function homeBlockProps(region: HomeBlocksProps, block: HomeBlock): BlockProps {
  return {
    overline: block.overline,
    state: BLOCK_STATE_OF_LOAD[region.load],
    emptyTitle: region.emptyTitle,
    emptyMessage: region.emptyMessage,
    errorTitle: region.errorTitle,
    errorMessage: region.errorMessage,
    retryLabel: region.retryLabel,
    onRetry: region.onRetry,
  };
}
