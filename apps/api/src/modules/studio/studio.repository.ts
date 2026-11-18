import { customer, design, lead, type TenantPool, userAccount } from '@heliogrid/db';
import type { DesignMount } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { TENANT_DB } from '../../common/db/tenant.token';
import {
  findLeadInScope,
  type LeadReader,
  leadCustomerJoin,
  leadScopeWhere,
  memberNameOf,
  sitePinOf,
} from '../crm/crm.public';

const author = alias(userAccount, 'design_author');

const designColumns = {
  id: design.id,
  ordinal: design.ordinal,
  mount: design.mount,
  status: design.status,
  recommended: design.recommended,
  createdBy: design.createdBy,
  createdByName: memberNameOf(author),
  createdAt: design.createdAt,
  updatedAt: design.updatedAt,
};

/** One design as stored, with its author's name. */
export interface DesignRow {
  readonly id: string;
  readonly ordinal: number;
  readonly mount: DesignMount;
  readonly status: (typeof design.$inferSelect)['status'];
  readonly recommended: boolean;
  readonly createdBy: string;
  readonly createdByName: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** A design opened: the design, and what its lead holds of the site and the customer. */
export interface DesignFacts {
  readonly design: DesignRow;
  readonly leadId: string;
  readonly customerName: string | null;
  readonly customerPhone: string | null;
  readonly site: {
    readonly name: string | null;
    readonly address: string | null;
    readonly pin: { readonly latitude: number; readonly longitude: number } | null;
    readonly area: { readonly area: string; readonly district: string | null } | null;
    readonly utilityOperator: string | null;
    readonly supplyPhase: (typeof lead.$inferSelect)['supplyPhase'];
    readonly sanctionedLoadKw: number | null;
  };
}

/**
 * A design's reads on the runtime pool. A design hangs on a lead, so every read is narrowed to the
 * leads the reader's presets reach — another company's design and one on a lead out of scope answer
 * alike, as no such design.
 */
@Injectable()
export class StudioRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The lead's designs, newest change first; `null` when the lead is not the reader's to see. */
  designsOf(reader: LeadReader, leadId: string): Promise<readonly DesignRow[] | null> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if ((await findLeadInScope(tx, reader, leadId)) === null) return null;
      return tx
        .select(designColumns)
        .from(design)
        .innerJoin(author, eq(author.id, design.createdBy))
        .where(and(eq(design.tenantId, tenantId), eq(design.leadId, leadId)))
        .orderBy(desc(design.updatedAt), desc(design.id));
    });
  }

  /** One design with its lead's site; `null` when its lead is not the reader's to see. */
  factsOf(reader: LeadReader, designId: string): Promise<DesignFacts | null> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select({
          ...designColumns,
          leadId: lead.id,
          customerName: customer.name,
          customerPhone: customer.phoneE164,
          siteName: lead.siteName,
          siteAddress: lead.siteAddress,
          siteLatitude: lead.siteLatitude,
          siteLongitude: lead.siteLongitude,
          siteArea: lead.siteArea,
          siteDistrict: lead.siteDistrict,
          siteUtility: lead.siteUtility,
          supplyPhase: lead.supplyPhase,
          sanctionedLoadKw: lead.sanctionedLoadKw,
        })
        .from(design)
        .innerJoin(author, eq(author.id, design.createdBy))
        .innerJoin(lead, and(eq(lead.id, design.leadId), eq(lead.tenantId, design.tenantId)))
        .innerJoin(customer, leadCustomerJoin)
        .where(
          and(
            eq(design.tenantId, tenantId),
            eq(design.id, designId),
            leadScopeWhere(reader.scope, reader.actorId),
          ),
        );
      if (row === undefined) return null;
      return {
        design: row,
        leadId: row.leadId,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        site: {
          name: row.siteName,
          address: row.siteAddress,
          pin: sitePinOf(row.siteLatitude, row.siteLongitude),
          area: row.siteArea === null ? null : { area: row.siteArea, district: row.siteDistrict },
          utilityOperator: row.siteUtility,
          supplyPhase: row.supplyPhase,
          sanctionedLoadKw: row.sanctionedLoadKw,
        },
      };
    });
  }
}
