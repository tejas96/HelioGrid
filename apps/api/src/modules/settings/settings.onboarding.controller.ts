import { onboardingContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { tenantIdOf } from '../../common/auth/session-context';
import { SettingsOnboardingService } from './settings.onboarding.service';

const MANAGE = { capability: 'onboarding.manage_tenant_settings' } as const;

@Controller()
export class SettingsOnboardingController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(SettingsOnboardingService) private readonly onboarding: SettingsOnboardingService,
  ) {}

  @TsRestHandler(onboardingContract)
  // The corridor is the owner's (`F2.M01`): the steps are theirs to answer, and a prompt-point
  // asks for a setting only they may give.
  @RouteAccessMap(onboardingContract, { progress: MANAGE, recordStep: MANAGE, promptPoint: MANAGE })
  handler(@Req() req: Request) {
    return tsRestHandler(onboardingContract, {
      progress: async () => ({
        status: 200,
        body: await this.onboarding.progress(tenantIdOf(req)),
      }),
      recordStep: async ({ params, body }) => ({
        status: 200,
        body: await this.onboarding.recordStep(
          tenantIdOf(req),
          params.step,
          body.state,
          Date.now(),
        ),
      }),
      promptPoint: async ({ params, body }) => ({
        status: 200,
        body: await this.onboarding.promptPoint(
          tenantIdOf(req),
          params.fact,
          body.state,
          Date.now(),
        ),
      }),
    });
  }
}
