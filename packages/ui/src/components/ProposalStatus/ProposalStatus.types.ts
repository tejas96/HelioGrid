import type { TranslatedText } from '@heliogrid/contracts';
import type { ProposalStanding } from '@heliogrid/domain';
import type { StatusChipDensity } from '../StatusChip/StatusChip.types';

/**
 * **Where a proposal stands**, as every surface that names one shows it (`M06-48`, `F7-12`): the
 * mark, the word and the tint together, never the tint alone. The word is the caller's, in the
 * reader's language; a standing a newer server learned takes the neutral tone.
 */
export interface ProposalStatusProps {
  readonly standing: ProposalStanding | (string & {});
  readonly label: TranslatedText;
  readonly density?: StatusChipDensity;
}
