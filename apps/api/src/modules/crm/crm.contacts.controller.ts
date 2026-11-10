import { contactsContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf, tenantIdOf } from '../../common/auth/session-context';
import { CrmContactsService } from './crm.contacts.service';
import { readerOf } from './internal/reader';

const ADD_EDIT = { capability: 'crm.add_edit_leads' } as const;

/**
 * A customer's contacts (`M02-34`): changed under the add-and-edit grant, as record edits in the
 * billing matrix; the role labels are every member's to read.
 */
@Controller()
export class CrmContactsController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmContactsService) private readonly contacts: CrmContactsService) {}

  @TsRestHandler(contactsContract)
  @RouteBillingMap(contactsContract, {
    add: 'create_edit_records',
    edit: 'create_edit_records',
    setPrimary: 'create_edit_records',
    addRoleLabel: 'create_edit_records',
  })
  @RouteAccessMap(contactsContract, {
    add: ADD_EDIT,
    edit: ADD_EDIT,
    setPrimary: ADD_EDIT,
    roleLabels: 'member',
    addRoleLabel: ADD_EDIT,
  })
  handler(@Req() req: Request) {
    return tsRestHandler(contactsContract, {
      add: async ({ params, body, headers }) => ({
        status: 201,
        body: await this.contacts.add(readerOf(req), params.id, body, headers, actOf(req)),
      }),
      edit: async ({ params, body }) => ({
        status: 200,
        body: await this.contacts.edit(readerOf(req), params.id, body),
      }),
      setPrimary: async ({ params, body }) => ({
        status: 200,
        body: await this.contacts.setPrimary(readerOf(req), params.id, body.contactId),
      }),
      roleLabels: async () => ({
        status: 200,
        body: await this.contacts.roleLabels(tenantIdOf(req)),
      }),
      addRoleLabel: async ({ body, headers }) => ({
        status: 201,
        body: await this.contacts.addRoleLabel(tenantIdOf(req), body, headers, actOf(req)),
      }),
    });
  }
}
