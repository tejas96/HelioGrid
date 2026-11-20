import {
  DESIGN_ACT_REFUSED,
  type DesignDetail,
  type DesignWire,
  designActRefusedEnvelope,
} from '@heliogrid/contracts';
import type { DesignActRefusal } from '@heliogrid/domain';
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

/** A refusal the design's lead gave, as the route declares it. */
export function refusedAct(refusal: DesignActRefusal): ContractException {
  return refusalWithFacts(designActRefusedEnvelope, HttpStatus.UNPROCESSABLE_ENTITY, {
    code: DESIGN_ACT_REFUSED,
    message: 'The design cannot do that from where its lead stands.',
    facts: { refusal },
  });
}
