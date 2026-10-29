import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { ComplianceFloorSpec } from './ComplianceFloor.types';

function isFloorSpec(value: object): value is ComplianceFloorSpec {
  return !(Symbol.iterator in value);
}

/** What a host's floor prop draws: a ready node as it is, a spec through `draw`, or nothing. */
export function complianceFloorFor(
  spec: ComplianceFloorSpec | ReactNode,
  draw: (spec: ComplianceFloorSpec) => ReactNode,
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec !== 'object' || !isFloorSpec(spec)) {
    return null;
  }
  return draw(spec);
}
