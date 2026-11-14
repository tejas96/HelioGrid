import { ENERGY_SOURCE_OF_RECORD } from '@heliogrid/contracts';
import { Module, type Provider } from '@nestjs/common';
import { ENV } from '../../config/env';
import { BillingModule } from '../billing/billing.public';
import { FileModule } from '../file/file.public';
import { SettingsModule } from '../settings/settings.public';
import { MemoryEnergySource } from './internal/energy-source.memory';
import { PvgisEnergySource } from './internal/energy-source.pvgis';
import { ProposalsAssembler } from './proposals.assembler.service';
import { ProposalsController } from './proposals.controller';
import { EnergyEstimateAdminRepository } from './proposals.energy.admin.repository';
import { EnergyEstimateReferenceRepository } from './proposals.energy.reference.repository';
import { ProposalsEnergyService } from './proposals.energy.service';
import { ProposalsGenerateRepository } from './proposals.generate.repository';
import { ProposalsGenerateService } from './proposals.generate.service';
import { ProposalLinksRegistry } from './proposals.links.repository';
import { ProposalsListRepository } from './proposals.list.repository';
import { ProposalsListService } from './proposals.list.service';
import { ProposalsPdfActivityRegistration } from './proposals.pdf.activities';
import { ProposalsPrintAdminRepository } from './proposals.print.admin.repository';
import { ProposalsPrintService } from './proposals.print.service';
import { ProposalsReadRepository } from './proposals.read.repository';
import { ProposalsRepository } from './proposals.repository';
import { ProposalsService } from './proposals.service';
import { ProposalsShareRepository } from './proposals.share.repository';
import { ProposalsShareService } from './proposals.share.service';
import { ProposalsVersionsRepository } from './proposals.versions.repository';
import { ProposalsVersionsService } from './proposals.versions.service';

/**
 * The energy source of record (`F8-08`). PVGIS binds everywhere but under TEST, where the memory
 * source stands in: a suite must never reach a third party, and a source that does not answer is
 * the fallback path the suite proves by default.
 */
const energySourceProvider: Provider = {
  provide: ENERGY_SOURCE_OF_RECORD,
  useFactory: () => (ENV.NODE_ENV === 'test' ? new MemoryEnergySource() : new PvgisEnergySource()),
};

/**
 * Proposals (`M06`): the one commercial document on a lead — its draft, the server's figures, the
 * Generate checklist, its versions and their PDF, and the share. The customer's link reaches a
 * shared version through the print service and the link registry it registers with.
 */
@Module({
  imports: [BillingModule, FileModule, SettingsModule],
  controllers: [ProposalsController],
  providers: [
    energySourceProvider,
    EnergyEstimateAdminRepository,
    EnergyEstimateReferenceRepository,
    ProposalLinksRegistry,
    ProposalsAssembler,
    ProposalsEnergyService,
    ProposalsGenerateRepository,
    ProposalsGenerateService,
    ProposalsListRepository,
    ProposalsListService,
    ProposalsPdfActivityRegistration,
    ProposalsPrintAdminRepository,
    ProposalsPrintService,
    ProposalsReadRepository,
    ProposalsRepository,
    ProposalsService,
    ProposalsShareRepository,
    ProposalsShareService,
    ProposalsVersionsRepository,
    ProposalsVersionsService,
  ],
  exports: [ProposalLinksRegistry, ProposalsPrintService, ProposalsVersionsService],
})
export class ProposalsModule {}
