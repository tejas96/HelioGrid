import { type SiteDataWire, studioDocumentSchema } from '@heliogrid/contracts';
import {
  type Coordinate,
  coordinateOf,
  type Roof,
  roofMiddle,
  type SiteDataCredit,
  type SiteDataGap,
} from '@heliogrid/domain';
import { roofGroupsOf } from '@heliogrid/domain/studio-kernel';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { find as timeZonesAt } from 'geo-tz';
import { PinoLogger } from 'nestjs-pino';
import { OutboxDispatcher } from '../../common/temporal/outbox.dispatcher';
import type { LeadReader } from '../crm/crm.public';
import {
  type GroupMap,
  type HeightsAnswer,
  heightsAnswerOf,
  noHeights,
} from './internal/site-data-answer';
import { keys, snapped, snappedRadius } from './internal/site-data-kept';
import { StudioDocumentRepository } from './studio.document.repository';
import { StudioRepository } from './studio.repository';
import { StudioSiteDataRepository } from './studio.site-data.repository';
import { type CallFacts, StudioSiteSources } from './studio.site-sources.service';

/** A group this tight is asked at the sharpest detail: a dormer's and a tank's edges keep. */
const SHARPEST_RADIUS_M = 60;

/**
 * The site data of a design (`T-M05-002`, part g): read inside the request that opens the studio,
 * since its answer is what that request needs (`07-integrations.md` §1). Google's height map, one
 * call for each group of roofs, and its building data at the pin and each roof's middle; where it
 * has none, OpenStreetMap's outlines; the far hills from PVGIS; the time zone from the point. Each
 * answer is kept for up to 30 days and shared by every company at the place. Nothing waits on a
 * source that does not answer: the answer says which did not.
 */
@Injectable()
export class StudioSiteDataService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(StudioRepository) private readonly designs: StudioRepository,
    @Inject(StudioDocumentRepository) private readonly documents: StudioDocumentRepository,
    @Inject(StudioSiteDataRepository) private readonly meters: StudioSiteDataRepository,
    @Inject(StudioSiteSources) private readonly sources: StudioSiteSources,
    @Inject(OutboxDispatcher) private readonly outbox: OutboxDispatcher,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StudioSiteDataService.name);
  }

  async siteData(reader: LeadReader, designId: string): Promise<SiteDataWire> {
    const facts = await this.designs.factsOf(reader, designId);
    if (facts === null) throw new NotFoundException('No such design.');
    const pin = facts.site.pin;
    const none: SiteDataWire = {
      ...noHeights(),
      farHorizon: null,
      timeZone: null,
      credits: [],
      gaps: ['heights_not_covered'],
    };
    if (pin === null) return none;
    const row = await this.documents.documentOf(reader, designId);
    const roofs: readonly Roof[] =
      row === null || row === undefined ? [] : studioDocumentSchema.parse(row.body).roofs;
    const now = Date.now();
    const gaps = new Set<SiteDataGap>();
    const billed = { calls: 0 };
    const call = { reader, now, gaps, billed };
    const [answer, farHorizon] = await Promise.all([
      this.heightsOf(pin, roofs, call),
      this.sources.farHorizonOf(pin, now, gaps),
    ]);
    if (billed.calls > 0) await this.meter(reader.tenantId, designId, billed.calls, now);
    const zones = timeZonesAt(pin.latitude, pin.longitude);
    const credits: SiteDataCredit[] = [];
    if (answer.source === 'google_solar') credits.push('google_solar');
    if (answer.source === 'openstreetmap') credits.push('openstreetmap');
    if (farHorizon !== null) credits.push('pvgis');
    return {
      ...answer,
      farHorizon,
      timeZone: zones[0] ?? null,
      credits,
      gaps: [...gaps],
    };
  }

  /** The heights part of the answer: Google's, else OpenStreetMap's, else none. */
  private async heightsOf(
    pin: Coordinate,
    roofs: readonly Roof[],
    call: CallFacts,
  ): Promise<HeightsAnswer> {
    if (!this.sources.heightsSetUp) {
      call.gaps.add('not_set_up');
      return this.sources.outlinesOf(pin, call.gaps);
    }
    const standing = roofs.filter((roof) => roof.on === undefined && roof.partOf === undefined);
    const middles = standing.map((roof) => roofMiddle(roof.corners));
    const groups = roofGroupsOf(middles);
    const points = new Map<string, Coordinate>();
    for (const at of [pin, ...middles.map((middle) => coordinateOf(pin, middle))]) {
      // Google answers the one building nearest a point: asked where the roof is, never snapped.
      points.set(keys.building(at), at);
    }
    const buildings = await Promise.all(
      [...points.values()].map((at) => this.sources.buildingAt(at, call)),
    );
    const sharpest = buildings.some((building) => building?.quality === 'high');
    const read = await Promise.all(
      groups.map(async (group, i): Promise<GroupMap | null> => {
        // The sharpest map is costly in bytes: asked at its group's own middle, never wider
        // than 60 m; any other is snapped, so neighbouring pins share it.
        const tight = sharpest && group.radiusM <= SHARPEST_RADIUS_M;
        const middle = coordinateOf(pin, group.middle);
        const at = tight ? middle : snapped(middle);
        const radiusM = tight ? SHARPEST_RADIUS_M : snappedRadius(group.radiusM);
        const map = await this.sources.heightMapAt(at, radiusM, tight, call);
        return map === null ? null : { group: i, map };
      }),
    );
    const maps = read.filter((one): one is GroupMap => one !== null);
    const answer = heightsAnswerOf({ pin, standing, groups, maps, buildings });
    return answer ?? this.sources.outlinesOf(pin, call.gaps);
  }

  /** The billed calls as cost lines; a metering failure never fails the opening it counts. */
  private async meter(tenantId: string, designId: string, calls: number, now: number) {
    try {
      const events = await this.meters.meterCalls(tenantId, designId, calls, now);
      for (const event of events) await this.outbox.dispatchNow(event);
    } catch (error) {
      const cause = error instanceof Error ? error.name : 'unknown';
      this.logger.error({ designId, cause }, 'a height data call could not be metered');
    }
  }
}
