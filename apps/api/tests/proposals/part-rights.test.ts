import type { RolePreset } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { rightsOf } from '../../src/modules/proposals/proposals.assembler.service';
import { preset } from '../crm/support';

/**
 * Step 8's two ways to a new part (`T-M06-010`, `M06-28`): a part is added inline only by a holder
 * of `F2.M01.add-own-catalog-items` or the catalog grant, and the spreadsheet import is offered only
 * to a holder of `F2.M01.manage-catalog` outright — Finance's limited grant reads prices and adds
 * nothing.
 */
describe('who may add a part from step 8, and who gets the spreadsheet path', () => {
  it.each<[RolePreset, boolean, boolean]>([
    [preset.epc_owner, true, true],
    [preset.operations, true, true],
    [preset.sales_manager, true, false],
    [preset.sales_executive, true, false],
    [preset.design_engineer, true, false],
    [preset.finance, false, false],
    [preset.survey_engineer, false, false],
    [preset.project_manager, false, false],
  ])('%s: adds a part %s, imports a spreadsheet %s', (role, adds, imports) => {
    const rights = rightsOf([role]);
    expect(rights.addsParts).toBe(adds);
    expect(rights.managesParts).toBe(imports);
  });
});
