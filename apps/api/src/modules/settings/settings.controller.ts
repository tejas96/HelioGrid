import { tenantSettingsContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { actOf, sessionOf, tenantIdOf } from '../../common/auth/session-context';
import { SettingsService } from './settings.service';
import { SettingsTemplatesService } from './settings.templates.service';

const MANAGE = { capability: 'onboarding.manage_tenant_settings' } as const;

@Controller()
export class SettingsController {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(SettingsTemplatesService) private readonly templates: SettingsTemplatesService,
  ) {}

  @TsRestHandler(tenantSettingsContract)
  // The resolved read is every member's: the builder and the documents read it under any
  // preset. Every write, and the settings screens' own reads, are the owner's (`F2.M01`).
  @RouteAccessMap(tenantSettingsContract, {
    effective: 'member',
    businessProfile: MANAGE,
    saveBusinessProfile: MANAGE,
    taxRegistrations: MANAGE,
    saveTaxRegistrations: MANAGE,
    branding: MANAGE,
    saveBranding: MANAGE,
    proposalTemplate: MANAGE,
    saveProposalTemplate: MANAGE,
    timelineTemplate: MANAGE,
    saveTimelineTemplate: MANAGE,
    trancheTemplates: MANAGE,
    createTrancheTemplate: MANAGE,
    saveTrancheTemplate: MANAGE,
    archiveTrancheTemplate: MANAGE,
    makeDefaultTrancheTemplate: MANAGE,
    holidays: MANAGE,
    saveHolidays: MANAGE,
  })
  handler(@Req() req: Request) {
    const tenantId = () => tenantIdOf(req);
    return tsRestHandler(tenantSettingsContract, {
      effective: async () => ({ status: 200, body: await this.settings.effective(tenantId()) }),
      businessProfile: async () => ({
        status: 200,
        body: await this.settings.businessProfile(tenantId()),
      }),
      saveBusinessProfile: async ({ body }) => ({
        status: 200,
        body: await this.settings.saveBusinessProfile(tenantId(), body, actOf(req)),
      }),
      taxRegistrations: async () => ({
        status: 200,
        body: await this.settings.taxRegistrations(tenantId()),
      }),
      saveTaxRegistrations: async ({ body }) => ({
        status: 200,
        body: await this.settings.saveTaxRegistrations(
          tenantId(),
          body,
          actOf(req),
          sessionOf(req).actor.interfaceLanguage,
        ),
      }),
      branding: async () => ({ status: 200, body: await this.settings.branding(tenantId()) }),
      saveBranding: async ({ body }) => ({
        status: 200,
        body: await this.settings.saveBranding(tenantId(), body, actOf(req)),
      }),
      proposalTemplate: async () => ({
        status: 200,
        body: await this.templates.proposalTemplate(tenantId()),
      }),
      saveProposalTemplate: async ({ body }) => ({
        status: 200,
        body: await this.templates.saveProposalTemplate(tenantId(), body, actOf(req)),
      }),
      timelineTemplate: async () => ({
        status: 200,
        body: await this.templates.timelineTemplate(tenantId()),
      }),
      saveTimelineTemplate: async ({ body }) => ({
        status: 200,
        body: await this.templates.saveTimelineTemplate(tenantId(), body, actOf(req)),
      }),
      trancheTemplates: async () => ({
        status: 200,
        body: await this.templates.trancheTemplates(tenantId()),
      }),
      createTrancheTemplate: async ({ body }) => ({
        status: 201,
        body: await this.templates.createTrancheTemplate(tenantId(), body, actOf(req)),
      }),
      saveTrancheTemplate: async ({ params, body }) => ({
        status: 200,
        body: await this.templates.saveTrancheTemplate(tenantId(), params.id, body, actOf(req)),
      }),
      archiveTrancheTemplate: async ({ params }) => ({
        status: 200,
        body: await this.templates.archiveTrancheTemplate(tenantId(), params.id, actOf(req)),
      }),
      makeDefaultTrancheTemplate: async ({ params }) => ({
        status: 200,
        body: await this.templates.makeDefaultTrancheTemplate(tenantId(), params.id, actOf(req)),
      }),
      holidays: async () => ({ status: 200, body: await this.settings.holidays(tenantId()) }),
      saveHolidays: async ({ body }) => ({
        status: 200,
        body: await this.settings.saveHolidays(tenantId(), body, actOf(req)),
      }),
    });
  }
}
