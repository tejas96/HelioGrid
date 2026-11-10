import type { PaginationQuery } from '@heliogrid/contracts';

/** A page as rows: how many, and how many to skip. */
export interface Page {
  readonly limit: number;
  readonly offset: number;
}

/** The page a `limit` and `page` ask for; the service derives the offset (apps/api/CLAUDE.md). */
export function pageOf(query: PaginationQuery): Page {
  return { limit: query.limit, offset: (query.page - 1) * query.limit };
}
