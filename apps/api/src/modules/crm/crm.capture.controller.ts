import { leadCaptureContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { CrmCaptureService } from './crm.capture.service';
import { actorNameOf, readerOf } from './internal/reader';

const ADD_EDIT = { capability: 'crm.add_edit_leads' } as const;

/**
 * Capture (`SCR-M02-01`): the live check, quick add and the sheet's enquiry answers — each the
 * add-and-edit grant's, since the check is part of capturing. *Keep both* further needs
 * `crm.dedupe_override`, which the service decides. Creating and logging are records
 * (`create_edit_records`), so a halted company is paused from them.
 */
@Controller()
export class CrmCaptureController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmCaptureService) private readonly capture: CrmCaptureService) {}

  @TsRestHandler(leadCaptureContract)
  @RouteBillingMap(leadCaptureContract, {
    create: 'create_edit_records',
    logEnquiry: 'create_edit_records',
    askOwner: 'create_edit_records',
  })
  @RouteAccessMap(leadCaptureContract, {
    match: ADD_EDIT,
    create: ADD_EDIT,
    logEnquiry: ADD_EDIT,
    askOwner: ADD_EDIT,
  })
  handler(@Req() req: Request) {
    return tsRestHandler(leadCaptureContract, {
      match: async ({ query }) => ({
        status: 200,
        body: await this.capture.match(readerOf(req), query.phone),
      }),
      create: async ({ body, headers }) => ({
        status: 201,
        body: await this.capture.create(readerOf(req), body, headers, actOf(req)),
      }),
      logEnquiry: async ({ params, body, headers }) => ({
        status: 201,
        body: await this.capture.logEnquiry(
          readerOf(req),
          actorNameOf(req),
          params.id,
          body,
          headers,
          actOf(req),
        ),
      }),
      askOwner: async ({ params, body, headers }) => ({
        status: 201,
        body: await this.capture.askOwner(
          readerOf(req),
          actorNameOf(req),
          params.id,
          body,
          headers,
          actOf(req),
        ),
      }),
    });
  }
}
