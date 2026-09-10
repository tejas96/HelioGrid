import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.public';
import { SettingsAdminRepository } from './settings.admin.repository';
import { SettingsController } from './settings.controller';
import { SettingsOnboardingController } from './settings.onboarding.controller';
import { SettingsOnboardingRepository } from './settings.onboarding.repository';
import { SettingsOnboardingService } from './settings.onboarding.service';
import { SettingsRepository } from './settings.repository';
import { SettingsService } from './settings.service';
import { SettingsTemplatesRepository } from './settings.templates.repository';
import { SettingsTemplatesService } from './settings.templates.service';
import { SettingsTranchesRepository } from './settings.tranches.repository';

/**
 * Tenant settings and the setup corridor (`T-M01-026`). It reads the tenant's market pack for
 * the tax formats and the holiday floor; the tenant module calls its seed inside the creation
 * transaction through the public surface, never the other way round.
 */
@Module({
  imports: [MarketModule],
  controllers: [SettingsController, SettingsOnboardingController],
  providers: [
    SettingsService,
    SettingsTemplatesService,
    SettingsOnboardingService,
    SettingsRepository,
    SettingsTemplatesRepository,
    SettingsTranchesRepository,
    SettingsOnboardingRepository,
    SettingsAdminRepository,
  ],
})
export class SettingsModule {}
