'use client';
import type { LeadDesignsSection } from '@heliogrid/data/react';
import { leadDesignActFailure, leadDesignsWords, proposalMoments } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { type LeadDesignsPanel, leadDesignsPanelOf, useFormat } from '@heliogrid/ui';

/**
 * The Designs section as `LeadSections` draws it (`T-M05-001`): the lead's design cards and their
 * acts, in the reader's words and on the company's clock.
 */
export function useLeadDesignsPanel(section: LeadDesignsSection): LeadDesignsPanel {
  const { t, locale } = useI18n();
  const format = useFormat();
  const moments = proposalMoments(t, { pack: format.pack, language: locale, now: Date.now() });
  return leadDesignsPanelOf(
    section,
    leadDesignsWords(t, { ago: moments.ago, readerId: section.readerId }),
    (failure) => leadDesignActFailure(t, failure),
  );
}
