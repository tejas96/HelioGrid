import { fileContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { actOf, rolesOf, tenantIdOf } from '../../common/auth/session-context';
import { FileService } from './file.service';

@Controller()
export class FileController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(FileService) private readonly files: FileService) {}

  @TsRestHandler(fileContract)
  // `member` at the door: WHICH capability a file needs is its subject kind's (`FILE_SUBJECT_RULES`),
  // known only once the body or the row is read, so the service decides it — proven by its tests.
  @RouteAccessMap(fileContract, {
    declare: 'member',
    complete: 'member',
    downloadUrl: 'member',
  })
  handler(@Req() req: Request) {
    return tsRestHandler(fileContract, {
      declare: async ({ body, headers }) => ({
        status: 201,
        body: await this.files.declare(tenantIdOf(req), rolesOf(req), body, headers, actOf(req)),
      }),
      complete: async ({ params }) => ({
        status: 200,
        body: await this.files.complete(tenantIdOf(req), rolesOf(req), params.id, actOf(req)),
      }),
      downloadUrl: async ({ params }) => ({
        status: 200,
        body: await this.files.downloadUrl(tenantIdOf(req), rolesOf(req), params.id, Date.now()),
      }),
    });
  }
}
