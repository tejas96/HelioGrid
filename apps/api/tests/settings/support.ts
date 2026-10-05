import { auditLogEntry } from '@heliogrid/db';
import { sql } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { CreationReplies } from '../../src/common/creation-key';
import { SettingsAdminRepository } from '../../src/modules/settings/settings.admin.repository';
import { QuietHoursRepository } from '../../src/modules/settings/settings.quiet-hours.repository';
import { SettingsRepository } from '../../src/modules/settings/settings.repository';
import { SettingsService } from '../../src/modules/settings/settings.service';
import { SettingsTemplatesRepository } from '../../src/modules/settings/settings.templates.repository';
import { SettingsTemplatesService } from '../../src/modules/settings/settings.templates.service';
import { SettingsTranchesRepository } from '../../src/modules/settings/settings.tranches.repository';
import type { openPools } from '../support/fixture';
import { marketsOf } from '../support/market';

export { publishIndiaPack } from '../support/market';

type Pools = ReturnType<typeof openPools>;

/** The entries one act left, oldest first — on the admin path, so a read failure is never mistaken for a refusal. */
export function entriesOf(pools: Pools, tenantId: string, eventType: string) {
  return pools.admin.db
    .select()
    .from(auditLogEntry)
    .where(
      sql`${auditLogEntry.tenantId} = ${tenantId} and ${auditLogEntry.eventType}::text = ${eventType}`,
    )
    .orderBy(auditLogEntry.occurredAt, auditLogEntry.id);
}

/** The two services as `settings.module.ts` composes them, over the real repositories on both pools. */
export function settingsServicesOf(pools: Pools): {
  settings: SettingsService;
  templates: SettingsTemplatesService;
} {
  const settings = new SettingsService(
    new SettingsRepository(pools.tenants),
    new SettingsAdminRepository(pools.admin.db),
    marketsOf(pools),
    new QuietHoursRepository(pools.tenants),
  );
  const templates = new SettingsTemplatesService(
    new SettingsTemplatesRepository(pools.tenants),
    new SettingsTranchesRepository(pools.tenants),
    settings,
    new CreationReplies(new PinoLogger({ pinoHttp: { level: 'silent' } })),
  );
  return { settings, templates };
}
