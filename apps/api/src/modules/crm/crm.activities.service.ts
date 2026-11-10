import type { ActivityPage, PaginationQuery } from '@heliogrid/contracts';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CrmActivitiesRepository } from './crm.activities.repository';
import { pageOf } from './internal/page';
import type { LeadReader } from './internal/reader';

/** The timeline's two reads (`M02-35`): a lead's entries, and a customer's one stream. */
@Injectable()
export class CrmActivitiesService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmActivitiesRepository) private readonly activities: CrmActivitiesRepository,
  ) {}

  async leadTimeline(
    reader: LeadReader,
    leadId: string,
    query: PaginationQuery,
  ): Promise<ActivityPage> {
    const page = await this.activities.leadTimeline(reader, leadId, pageOf(query));
    if (page === null) throw new NotFoundException('No such lead.');
    return page;
  }

  async customerTimeline(
    reader: LeadReader,
    customerId: string,
    query: PaginationQuery,
  ): Promise<ActivityPage> {
    const page = await this.activities.customerTimeline(reader, customerId, pageOf(query));
    if (page === null) throw new NotFoundException('No such customer.');
    return page;
  }
}
