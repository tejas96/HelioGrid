import type { DesignDetail, DesignWire } from '@heliogrid/contracts';
import { memberRefOf } from '../../crm/crm.public';
import type { DesignFacts, DesignRow } from '../studio.repository';

/** One design as the wire carries it. */
export function designWireOf(row: DesignRow): DesignWire {
  return {
    id: row.id,
    ordinal: row.ordinal,
    mount: row.mount,
    status: row.status,
    recommended: row.recommended,
    createdBy: memberRefOf(row.createdBy, row.createdByName),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** A design opened: the studio's two blocks, the host's subject, and the reader's right to change it. */
export function designDetailOf(facts: DesignFacts, canEdit: boolean): DesignDetail {
  return {
    design: designWireOf(facts.design),
    site: facts.site,
    subject: {
      leadId: facts.leadId,
      customerName: facts.customerName,
      customerPhone: facts.customerPhone,
    },
    canEdit,
  };
}
