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
  subscription_state_history:
    'every state a subscription entered, when and why; only the admin path writes it (M12-04, T-M12-005)',
  subscription_payment:
    'every charge the gateway collected, the entitlement truth; only the admin path writes it (M12-09, T-M12-006)',
  invoice_line:
    'one line of an issued platform invoice, frozen with it; only the admin path writes it ' +
    '(M12-44, T-M12-012a)',
  invoice_line_tax:
    'one tax component of an issued invoice line, frozen with it; only the admin path writes it ' +
    '(M12-44, T-M12-012a)',
  entitlement_override:
    'support’s audited acts on a company’s limits and trial, never an edit; only the admin path ' +
    'writes it (M12-19, M12-52, T-M12-008)',
  usage_event:
    'one metered unit of work, the only usage counter there is; only the outbox step writes it, on ' +
    'the admin path (M12-32, T-M12-010)',
  storage_gauge_snapshot:
    'a company’s stored bytes, read once a night; only the nightly step writes it (M12-33, T-M12-010)',
  orchestration_outbox:
    'a handoff to Temporal, written in its change’s transaction; only the dispatcher marks it, on ' +
    'the admin path (infra/temporal/README.md §5, T-M01-030)',
  activity:
    'the one timeline a customer and their leads show: nothing edits or deletes an entry, a ' +
    'correction is a new one, and a merge reads through the tombstone (M02-35, T-M02-012)',
  lead_stage_transition:
    'every funnel and R9 move of a lead; a reopen is a new row, never a rewrite of the close ' +
    '(M02-56, M13-22, T-M02-015)',
  lead_assignment:
    'every assignment of a lead with the assignee’s open count at that moment (M02-30, T-M02-011)',
  project_stage_transition:
    'every move of a project, forward, back, undone or cancelled; days in stage and the customer ' +
    'link’s history read it (M08-14, M08-29)',
  lead_file:
    'a file added to a lead; a new file is a new row and the earlier one stays readable (M02-32)',
  project_payment:
    'every payment recorded on a project and every reversal of one; a mistake is reversed, never ' +
    'edited or deleted (M11-40, M11-46)',
  tranche_request_share:
    'each tap that shared a part’s pay request — what stops a second person asking twice ' +
    '(ruling 2026-11-10)',
};
