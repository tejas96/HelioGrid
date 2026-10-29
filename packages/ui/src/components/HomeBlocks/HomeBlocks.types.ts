import type { TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';

/** One block of the home: the home's own work, or a composed preset's (`M13-10`). */
export interface HomeBlock {
  key: string;
  /** The preset whose work the block holds — its overline. */
  overline: TranslatedText;
}

/**
 * The home's region (`M13-10`): one block for the home's own work and one per composed preset.
 * Until each module's home lands, a loaded block TEACHES — what will show here and who to ask —
 * never a blank (`M01-17`); the module then replaces its block. Side by side where two fit.
 */
export interface HomeBlocksProps {
  blocks: HomeBlock[];
  /** The shell's own read, passed straight through; a ready read teaches. */
  read: Read<unknown>;
  /** Each block's wait, spoken while the read is out — *Loading*. */
  loadingLabel: TranslatedText;
  emptyTitle: TranslatedText;
  emptyMessage: TranslatedText;
  errorTitle: TranslatedText;
  errorMessage: TranslatedText;
  retryLabel: TranslatedText;
}
