/**
 * The append-only ledgers that EXIST, each named with its law. `tenancy-rls` asserts from the
 * catalog that no RLS-subject role holds UPDATE on any column, DELETE or TRUNCATE on them — a
 * privilege question that cannot be fooled by an unrelated error, where the older form ran an
 * `update` and accepted any exception. A table nobody built matches no catalog row and passes
 * silently, so a ledger joins this list in the change that lands it (Law 12), and the list is
 * asserted non-empty.
 */
export const APPEND_ONLY_LEDGERS: Record<string, string> = {
  audit_log_entry: 'the tenant’s own record of what the product performed (F2-22, T-FPLAT-004)',
  catalog_rate_entry:
    'a component’s dated rate ledger: a past output names the rate it used (M01-44, T-M01-027)',
  catalog_release:
    'a labelled publish of the tenant’s catalog changes, pinned by designs and proposals (M01-43)',
  catalog_release_line: 'one changed item of a release, immutable with it (M01-43, T-M01-027)',
  price_book_version:
    'one immutable set of non-catalog rates, pinned by designs and sent proposals (M01-48, M01-49)',
  price_book_rate: 'one rate of a price-book version, immutable with it (M01-48, T-M01-031)',
  orchestration_outbox:
    'a handoff to Temporal, written in its change’s transaction; only the dispatcher marks it, on ' +
    'the admin path (infra/temporal/README.md §5, T-M01-030)',
};
