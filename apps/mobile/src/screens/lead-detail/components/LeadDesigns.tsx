import type { LeadDesignsSection } from '@heliogrid/data/react';
import { leadDesignActFailure, leadDesignsWords } from '@heliogrid/i18n';
import { type LeadDesignsPanel, leadDesignsPanelOf } from '@heliogrid/ui';
import { useProposalFormats } from '../../shared/use-proposal-formats';

/**
 * The Designs section as `LeadSections` draws it on the phone (`T-M05-001`): the lead's design
 * cards and their acts, in the reader's words and on the company's clock.
 */
export function useLeadDesignsPanel(section: LeadDesignsSection): LeadDesignsPanel {
  const { t, formats } = useProposalFormats();
  return leadDesignsPanelOf(
    section,
    leadDesignsWords(t, { ago: formats.ago, readerId: section.readerId }),
    (failure) => leadDesignActFailure(t, failure),
  );
}
