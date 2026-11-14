import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.public';
import { FileModule } from '../file/file.public';
import { NotificationModule } from '../notification/notification.public';
import { ProposalsModule } from '../proposals/proposals.public';
import { SettingsModule } from '../settings/settings.public';
import { CustomerLinkActsRepository } from './customer-link.acts.repository';
import { CustomerLinkActsService } from './customer-link.acts.service';
import { CustomerLinkAsksRepository } from './customer-link.asks.repository';
import { CustomerLinkController } from './customer-link.controller';
import { CustomerLinkPageRepository } from './customer-link.page.repository';
import { CustomerLinkPageService } from './customer-link.page.service';
import { CustomerProjectsRegistry } from './customer-link.projects.repository';
import { CustomerLinkPublicController } from './customer-link.public.controller';
import { CustomerLinkRepository } from './customer-link.repository';
import { CustomerLinkService } from './customer-link.service';
import { SharedProposalLinks } from './customer-link.shared.repository';
import { LinkTokenAdminRepository } from './customer-link.token.admin.repository';
import { PublicCeiling } from './internal/public-ceiling';

/**
 * The customer link (`F5`): one tokenised address per person per deal — the proposal, then the
 * progress, then the solar file — with the company's link manager beside it. No customer account,
 * no session, no second destination (`F5-01`, `F5-02`).
 */
@Module({
  // Auth, for the one question a public route asks of a session: is this a company's own member?
  imports: [AuthModule, FileModule, NotificationModule, ProposalsModule, SettingsModule],
  controllers: [CustomerLinkController, CustomerLinkPublicController],
  providers: [
    CustomerLinkActsRepository,
    CustomerLinkActsService,
    CustomerLinkAsksRepository,
    CustomerLinkPageRepository,
    CustomerLinkPageService,
    CustomerLinkRepository,
    CustomerLinkService,
    CustomerProjectsRegistry,
    LinkTokenAdminRepository,
    PublicCeiling,
    SharedProposalLinks,
  ],
  exports: [CustomerProjectsRegistry, PublicCeiling],
})
export class CustomerLinkModule {}
