'use client';
import type { DesignSubjectWire } from '@heliogrid/contracts';
import { siteDetailsPageWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { useFormat } from '@heliogrid/ui';

/**
 * Who a design is for, as a studio page's head says it: the lead's name for the way back and the
 * "For …" line under the title, the number in the company's own grouping. Both are `null` until
 * the design is read.
 */
export function useStudioSubject(subject: DesignSubjectWire | null) {
  const t = useTranslate();
  const format = useFormat();
  const page = siteDetailsPageWords(t);
  if (subject === null) return { page, lead: null, summary: null };
  const phone = subject.customerPhone === null ? null : format.phone(subject.customerPhone);
  return {
    page,
    lead: page.leadNamed(subject.customerName, phone),
    summary: page.forWho(subject.customerName, phone),
  };
}
