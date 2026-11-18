import type { TranslatedText } from '@heliogrid/contracts';
import type { DesignStatus as DesignStatusValue } from '@heliogrid/domain';
import type { StatusChipDensity } from '../StatusChip/StatusChip.types';

/**
 * **Where a design stands**, as every surface that names one shows it (`T-M05-001`, `F7-12`): the
 * mark, the word and the neutral tint together. The word is the caller's, in the reader's
 * language; a status a newer server learned keeps the tint with no mark.
 */
export interface DesignStatusProps {
  readonly status: DesignStatusValue | (string & {});
  readonly label: TranslatedText;
  readonly density?: StatusChipDensity;
}
