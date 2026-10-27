import type {
  BrandingRead,
  BrandingSave,
  BusinessProfileRead,
  BusinessProfileWrite,
  ProposalTemplate,
  ProposalTemplateRead,
  TaxRegistrations,
  TimelineTemplate,
  TimelineTemplateRead,
  TrancheSchedulePreview,
  TrancheSchedulePreviewRequest,
  TrancheTemplate,
  TrancheTemplateList,
  TrancheTemplateWrite,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { bodyAt, normalizeClientError, toApiError } from '../errors/errors';

/** A company's settings (`M01-31`). The api answers only a person who manages them. */
export interface SettingsRepository {
  businessProfile(signal?: AbortSignal): Promise<BusinessProfileRead>;
  /** Replaces the profile whole: send what was read, changed where the person answered. */
  saveBusinessProfile(profile: BusinessProfileWrite): Promise<BusinessProfileRead>;
  taxRegistrations(signal?: AbortSignal): Promise<TaxRegistrations>;
  /** Replaces the list whole; the api refuses it whole when one entry is malformed (`M01-25`). */
  saveTaxRegistrations(registrations: TaxRegistrations): Promise<TaxRegistrations>;
  /** Branding as its page reads it: the logo beside it and who saved it last (`SCR-M01-18`). */
  branding(signal?: AbortSignal): Promise<BrandingRead>;
  /** The colour, the letterhead and the logo as one write; the colour is never refused (`F7-07`). */
  saveBranding(branding: BrandingSave): Promise<BrandingRead>;
  /** The document defaults and who saved them last (`SCR-M01-19`); the platform's where unset. */
  proposalTemplate(signal?: AbortSignal): Promise<ProposalTemplateRead>;
  /** Replaces the document defaults whole; the terms always stay in the section set. */
  saveProposalTemplate(template: ProposalTemplate): Promise<ProposalTemplateRead>;
  /** The project phases in order and who saved them last; the platform's where unset. */
  timelineTemplate(signal?: AbortSignal): Promise<TimelineTemplateRead>;
  /** Replaces the phases whole, in the order sent. */
  saveTimelineTemplate(timeline: TimelineTemplate): Promise<TimelineTemplateRead>;
  /** Every payment-term template and who saved one last (`SCR-M01-20`). */
  trancheTemplates(signal?: AbortSignal): Promise<TrancheTemplateList>;
  /** A new template; a retry of the same input carries the same key, so one is made (`F4-07`). */
  createTrancheTemplate(template: TrancheTemplateWrite): Promise<TrancheTemplate>;
  saveTrancheTemplate(id: string, template: TrancheTemplateWrite): Promise<TrancheTemplate>;
  /** One of the three acts on a template: each answers the template as it now stands. */
  actOnTrancheTemplate(id: string, act: TrancheTemplateAct): Promise<TrancheTemplate>;
  /** The schedule on the sample contract, worked out by the api (`F4-04`). */
  previewTrancheSchedule(
    request: TrancheSchedulePreviewRequest,
    signal?: AbortSignal,
  ): Promise<TrancheSchedulePreview>;
}

export type TrancheTemplateAct = 'archive' | 'restore' | 'make-default';

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createSettingsRepository(api: ApiClient): SettingsRepository {
  const creationKeys = createCreationKeys();
  const acts = {
    archive: api.tenantSettings.archiveTrancheTemplate,
    restore: api.tenantSettings.restoreTrancheTemplate,
    'make-default': api.tenantSettings.makeDefaultTrancheTemplate,
  } satisfies Record<TrancheTemplateAct, unknown>;
  return {
    async businessProfile(signal) {
      try {
        const res = await api.tenantSettings.businessProfile({ fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async saveBusinessProfile(profile) {
      try {
        const res = await api.tenantSettings.saveBusinessProfile({ body: profile });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async taxRegistrations(signal) {
      try {
        const res = await api.tenantSettings.taxRegistrations({ fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async saveTaxRegistrations(registrations) {
      try {
        const res = await api.tenantSettings.saveTaxRegistrations({ body: registrations });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async branding(signal) {
      try {
        const res = await api.tenantSettings.branding({ fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async saveBranding(branding) {
      try {
        const res = await api.tenantSettings.saveBranding({ body: branding });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async proposalTemplate(signal) {
      try {
        const res = await api.tenantSettings.proposalTemplate({ fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async saveProposalTemplate(template) {
      try {
        const res = await api.tenantSettings.saveProposalTemplate({ body: template });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async timelineTemplate(signal) {
      try {
        const res = await api.tenantSettings.timelineTemplate({ fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async saveTimelineTemplate(timeline) {
      try {
        const res = await api.tenantSettings.saveTimelineTemplate({ body: timeline });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    trancheTemplates: (signal) =>
      bodyAt(() => api.tenantSettings.trancheTemplates({ fetchOptions: { signal } }), 200),
    async createTrancheTemplate(template) {
      const headers = creationKeys.headersFor(template);
      const made = await bodyAt(
        () => api.tenantSettings.createTrancheTemplate({ body: template, headers }),
        201,
      );
      creationKeys.settle();
      return made;
    },
    saveTrancheTemplate: (id, template) =>
      bodyAt(() => api.tenantSettings.saveTrancheTemplate({ params: { id }, body: template }), 200),
    actOnTrancheTemplate: (id, act) => bodyAt(() => acts[act]({ params: { id } }), 200),
    previewTrancheSchedule: (request, signal) =>
      bodyAt(
        () =>
          api.tenantSettings.previewTrancheSchedule({ body: request, fetchOptions: { signal } }),
        200,
      ),
  };
}
