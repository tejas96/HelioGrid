import {
  DESIGN_ACT_REFUSED,
  type DesignDetail,
  type DesignWire,
  designActRefusedEnvelope,
} from '@heliogrid/contracts';
import type { DesignActRefusal, RoofType, SiteRoofHint } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import {
  type ContractException,
  refusalWithFacts,
} from '../../../common/errors/contract-exception';
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

/**
 * The lead's roof type in the studio's words. The studio names no record of this host's: a roof
 * type it has no roof for (panels on the ground) is no hint.
 */
const SITE_ROOF: Record<RoofType, SiteRoofHint | null> = {
  rcc_flat: 'concrete_flat',
  metal_shed: 'metal_shed',
  tile: 'tile',
  ground_array: null,
};

/** A design opened: the studio's two blocks, the host's subject, and the reader's right to change it. */
export function designDetailOf(facts: DesignFacts, canEdit: boolean): DesignDetail {
  return {
    design: designWireOf(facts.design),
    site: facts.site,
    subject: {
      leadId: facts.leadId,
      customerName: facts.customerName,
      customerPhone: facts.customerPhone,
      siteRoof: facts.roofType === null ? null : SITE_ROOF[facts.roofType],
    },
    canEdit,
  };
}

/** A refusal the design's lead gave, as the route declares it. */
export function refusedAct(refusal: DesignActRefusal): ContractException {
  return refusalWithFacts(designActRefusedEnvelope, HttpStatus.UNPROCESSABLE_ENTITY, {
    code: DESIGN_ACT_REFUSED,
    message: 'The design cannot do that from where its lead stands.',
    facts: { refusal },
  });
}
