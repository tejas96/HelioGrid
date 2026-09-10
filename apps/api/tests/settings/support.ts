import { auditLogEntry } from '@heliogrid/db';
import { IN_PACK } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import { MarketPackAdminRepository } from '../../src/modules/market/market.admin.repository';
import { MarketPackRepository } from '../../src/modules/market/market.repository';
import { MarketPackService } from '../../src/modules/market/market.service';
import { SettingsAdminRepository } from '../../src/modules/settings/settings.admin.repository';
import { SettingsRepository } from '../../src/modules/settings/settings.repository';
import { SettingsService } from '../../src/modules/settings/settings.service';
import { SettingsTemplatesRepository } from '../../src/modules/settings/settings.templates.repository';
import { SettingsTemplatesService } from '../../src/modules/settings/settings.templates.service';
import { SettingsTranchesRepository } from '../../src/modules/settings/settings.tranches.repository';
import type { openPools } from '../support/fixture';

type Pools = ReturnType<typeof openPools>;

/**
 * What every settings proof needs beside the fixture: the market pack published for real — the
 * tax formats and the holiday floor come from it — and the log read back on the admin path.
 */
export async function publishIndiaPack(pools: Pools): Promise<void> {
  const markets = marketsOf(pools);
  try {
    await markets.publish(IN_PACK, new Date().toISOString());
  } catch {
    // Two proofs publish at once and race for the same revision number; the loser retries and
    // finds the winner's revision already equal to the pack, so it writes nothing.
    await markets.publish(IN_PACK, new Date().toISOString());
  }
}

export function marketsOf(pools: Pools): MarketPackService {
  return new MarketPackService(
    new MarketPackRepository(pools.runtime.db),
    new MarketPackAdminRepository(pools.admin.db),
  );
}

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
    new SettingsRepository(pools.runtime.db),
    new SettingsAdminRepository(pools.admin.db),
    marketsOf(pools),
  );
  const templates = new SettingsTemplatesService(
    new SettingsTemplatesRepository(pools.runtime.db),
    new SettingsTranchesRepository(pools.runtime.db),
    settings,
  );
  return { settings, templates };
}
