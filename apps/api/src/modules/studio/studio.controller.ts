import { placesContract, studioContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { responseOf } from '../../common/auth/cookies';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf, tenantIdOf } from '../../common/auth/session-context';
import { readerOf } from '../crm/crm.public';
import { StudioDocumentService } from './studio.document.service';
import { StudioPictureService } from './studio.picture.service';
import { StudioPlacesService } from './studio.places.service';
import { StudioService } from './studio.service';

const DESIGN = { capability: 'studio.create_edit_designs' } as const;

/**
 * Designs (`T-M05-001`), their documents (`T-M05-002a`) and their own pictures (`T-M05-002d`). Reading is every member's, narrowed to the leads their presets reach
 * (`F2.M02.lead-visibility`); making and changing one is the create-and-edit grant's. In the
 * billing matrix every write is the studio's own row, which pauses with the plan; reading never
 * pauses.
 */
@Controller()
export class StudioController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(StudioService) private readonly studio: StudioService,
    @Inject(StudioDocumentService) private readonly documents: StudioDocumentService,
    @Inject(StudioPictureService) private readonly pictures: StudioPictureService,
  ) {}

  // Topmost, so it is applied last: it serves each route from what the maps below declared.
  @TsRestHandler(studioContract)
  @RouteBillingMap(studioContract, {
    create: 'studio_design_edit',
    saveSite: 'studio_design_edit',
    recommend: 'studio_design_edit',
    saveDocument: 'studio_design_edit',
    addPicture: 'studio_design_edit',
    addCadPlan: 'studio_design_edit',
    // A turn to edit changes nothing in the design: taking and giving it back pause with nothing.
    takeEditTurn: 'ungated',
    giveEditTurn: 'ungated',
  })
  @RouteAccessMap(studioContract, {
    leadDesigns: 'member',
    create: DESIGN,
    detail: 'member',
    saveSite: DESIGN,
    recommend: DESIGN,
    document: 'member',
    saveDocument: DESIGN,
    takeEditTurn: DESIGN,
    giveEditTurn: DESIGN,
    skyPicture: 'member',
    addPicture: DESIGN,
    addCadPlan: DESIGN,
    picture: 'member',
  })
  handler(@Req() req: Request) {
    const reader = readerOf(req);
    const act = actOf(req);
    const ok = <Body>(body: Body) => ({ status: 200 as const, body });
    return tsRestHandler(studioContract, {
      leadDesigns: async ({ params }) => ok(await this.studio.designsOf(reader, params.id)),
      create: async ({ params, body, headers }) => ({
        status: 201 as const,
        body: await this.studio.create(reader, params.id, body, headers, act),
      }),
      detail: async ({ params }) => ok(await this.studio.detail(reader, params.id)),
      saveSite: async ({ params, body }) =>
        ok(await this.studio.saveSite(reader, params.id, body, act)),
      recommend: async ({ params, body }) =>
        ok(await this.studio.recommend(reader, params.id, body.recommended)),
      document: async ({ params }) => {
        // Nothing of a design is kept on the device (`F4`): no browser or web view caches it.
        responseOf(req).setHeader('Cache-Control', 'no-store');
        return ok(await this.documents.documentOf(reader, params.id));
      },
      saveDocument: async ({ params, body }) =>
        ok(await this.documents.save(reader, params.id, body, act)),
      takeEditTurn: async ({ params }) => ok(await this.documents.takeTurn(reader, params.id, act)),
      giveEditTurn: async ({ params }) => {
        await this.documents.giveTurn(reader, params.id, act);
        return { status: 204 as const, body: undefined };
      },
      addPicture: async ({ params, body, headers }) => ({
        status: 201 as const,
        body: await this.pictures.add(reader, params.id, { read: 'device', ...body }, headers, act),
      }),
      addCadPlan: async ({ params, body, headers }) => ({
        status: 201 as const,
        body: await this.pictures.add(reader, params.id, { read: 'server', ...body }, headers, act),
      }),
      picture: async ({ params }) => {
        // The links to its parts are short-lived: no browser or web view keeps the answer.
        responseOf(req).setHeader('Cache-Control', 'no-store');
        return ok(await this.pictures.picture(reader, params.id, params.pictureId, Date.now()));
      },
      skyPicture: async ({ params }) => {
        // Google's picture is never stored, nor put in a file — a cache on disk included.
        responseOf(req).setHeader('Cache-Control', 'no-store');
        return ok(await this.documents.skyPicture(reader, params.id));
      },
    });
  }
}

/**
 * The place search of Site details. It reads no company record, but each ask can cost money at the
 * map service, so it is the design grant's alone — the only people who fill that form.
 */
@Controller()
export class PlacesController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(StudioPlacesService) private readonly places: StudioPlacesService) {}

  @TsRestHandler(placesContract)
  @RouteAccessMap(placesContract, { suggest: DESIGN, details: DESIGN, at: DESIGN })
  handler(@Req() req: Request) {
    const tenantId = tenantIdOf(req);
    const ok = <Body>(body: Body) => ({ status: 200 as const, body });
    return tsRestHandler(placesContract, {
      suggest: async ({ query }) =>
        ok(await this.places.suggest(tenantId, query.query, query.session)),
      details: async ({ query }) =>
        ok(await this.places.details(tenantId, query.placeId, query.session)),
      at: async ({ query }) => ok(await this.places.at(tenantId, query)),
    });
  }
}
