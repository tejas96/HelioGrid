import { searchContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { readerOf } from '../crm/crm.public';
import { SearchService } from './search.service';

/**
 * The global search (`SCR-SHELL-02`): every member searches, each group narrowed to what their own
 * scopes let them open. A read, so it names no billing row and works in every billing state.
 */
@Controller()
export class SearchController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(SearchService) private readonly searches: SearchService) {}

  @TsRestHandler(searchContract)
  @RouteAccessMap(searchContract, { search: 'member' })
  handler(@Req() req: Request) {
    return tsRestHandler(searchContract, {
      search: async ({ query }) => ({
        status: 200,
        body: await this.searches.search(readerOf(req), query, Date.now()),
      }),
    });
  }
}
