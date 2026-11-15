import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { CustomerProjectsRegistry } from '../customer-link/customer-link.public';
import { ProjectsCustomerService } from './projects.customer.service';

/**
 * Binds this module's customer service to the customer link (`F5-19`): once a deal is won, the
 * link reads its phase, its progress and its solar file from here. The link module imports
 * nothing of projects — it holds the registry this registers with — so the two never form a cycle.
 */
@Injectable()
export class ProjectsCustomerLinkBinding implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CustomerProjectsRegistry) private readonly registry: CustomerProjectsRegistry,
    @Inject(ProjectsCustomerService) private readonly projects: ProjectsCustomerService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.projects);
  }
}
