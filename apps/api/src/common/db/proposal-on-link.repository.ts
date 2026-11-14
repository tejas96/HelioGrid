import { proposal, proposalVersion } from '@heliogrid/db';
import { sql } from 'drizzle-orm';

/*
 * The SQL mirror of `versionsOnLink(...).shown` (`@heliogrid/domain`, `version-on-link.ts`), the one
 * statement of which version's price a proposal shows (`M06-45`). Shared here because `crm` and
 * `proposals` both price a proposal and `crm` may not import `proposals`; a change to the rule
 * changes the domain function first and this fragment with it.
 */

/** The version on the customer's link — the latest shared — else the latest generated. */
export const versionOnLink = sql<
  number | null
>`coalesce(${proposal.sharedVersion}, ${proposal.latestVersion})`;

/** A proposal's price as every list and total shows it: `versionOnLink`'s payable, else the draft's. */
export const payableOnLink = sql<number | null>`coalesce((
  select ${proposalVersion.payableMinor} from ${proposalVersion}
  where ${proposalVersion.tenantId} = ${proposal.tenantId}
    and ${proposalVersion.proposalId} = ${proposal.id}
    and ${proposalVersion.version} = ${versionOnLink}
), ${proposal.payableMinor})`.mapWith(Number);
