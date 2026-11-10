import { formatPhone } from '@heliogrid/domain';
import { leadUnassignedNotice } from '@heliogrid/i18n';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  NotificationPushService,
  renderedInEveryLanguage,
} from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import { CrmDailySweepAdminRepository } from './crm.daily-sweep.admin.repository';
import { CrmDailySweepRepository } from './crm.daily-sweep.repository';

/** At most this many companies per run, so one run stays inside its step's timeout. */
const SWEEP_BATCH = 200;

/**
 * The CRM's one timer (`M02-49`, RFC decision 7): every run sweeps each company whose day has passed
 * 09:00 on its own clock and has not been swept, once per local day. One company's failure is
 * logged by its id and leaves its day unclaimed, so the next run tries it again and every other
 * company is swept meanwhile.
 */
@Injectable()
export class CrmDailySweepService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmDailySweepAdminRepository) private readonly due: CrmDailySweepAdminRepository,
    @Inject(CrmDailySweepRepository) private readonly sweeps: CrmDailySweepRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CrmDailySweepService.name);
  }

  /** The result is the workflow's contract: a running worker reads exactly this count. */
  async sweepDueTenants(now: number): Promise<{ swept: number }> {
    let swept = 0;
    for (const tenantId of await this.due.dueTenants(now, SWEEP_BATCH)) {
      try {
        if (await this.sweepTenant(tenantId, now)) swept += 1;
      } catch (error) {
        this.logger.warn({ tenantId, err: error }, 'a company’s CRM sweep failed; it runs again');
      }
    }
    return { swept };
  }

  /**
   * One company's sweep at `now`; `false` when its clock is before 09:00 or its day is already
   * swept. The notices' pushes leave after the commit, held by the company's quiet hours.
   */
  async sweepTenant(tenantId: string, now: number): Promise<boolean> {
    const [{ formats }, quietHours] = await Promise.all([
      this.settings.packOf(tenantId),
      this.settings.quietHoursOf(tenantId),
    ]);
    const notice = {
      quietHours,
      wordsFor: (lead: { name: string | null; phoneE164: string }) => {
        const name = lead.name ?? formatPhone(formats, lead.phoneE164);
        return renderedInEveryLanguage((translate) => leadUnassignedNotice(translate, { name }));
      },
    };
    const { swept, notified } = await this.sweeps.sweep(tenantId, now, notice);
    await this.push.deliverAfterCommit(tenantId, notified, new Date(now));
    return swept;
  }
}
