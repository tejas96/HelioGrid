import type { SiteDataWire, SkyPictureWire } from '@heliogrid/contracts';
import { type BuildingAnswer, ROOF_DATA_PORT, type RoofDataPort } from '@heliogrid/contracts';
import type { Coordinate, SiteDataGap } from '@heliogrid/domain';
import {
  CALL_RADIUS_MAX_M,
  roofGroupsOf,
  SKYLINE_STEP_DEG,
  skylineFromSouthBearings,
} from '@heliogrid/domain/studio-kernel';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { z } from 'zod';
import type { LeadReader } from '../crm/crm.public';
import { FileCacheService } from '../file/file.public';
import { PerMinuteCap } from './internal/per-minute-cap';
import { type HeightsAnswer, noHeights, outlinesAnswerOf } from './internal/site-data-answer';
import {
  fresh,
  type KeptBuilding,
  type KeptHeightMap,
  keptBuildingSchema,
  keptHeightMapOf,
  keptHeightMapSchema,
  keptHorizonSchema,
  keptNoMapSchema,
  keptPinMapSchema,
  keptVersion,
  keys,
  snapped,
  snappedRadius,
} from './internal/site-data-kept';
import {
  BUILDING_OUTLINE_SOURCE,
  type BuildingOutlineSource,
  FAR_HORIZON_SOURCE,
  type FarHorizonSource,
} from './internal/site-surrounds';
import { straightDownOf } from './internal/straight-down';

/**
 * The openings one person may ask Google for in a minute. Each opening of a new place is billed,
 * so a reload loop is capped: past it the studio opens on the market's floors and says the data
 * did not answer. A place kept from an earlier opening costs nothing and counts nothing; a campus
 * opening asks for each of its roofs and counts once.
 */
const OPENINGS_PER_MINUTE = 12;
/** OpenStreetMap's buildings are asked this far round the pin. */
const OUTLINES_RADIUS_M = 100;
const TENTHS = 10;
/** The radii the pin's call is kept at: a house's, and a house with roofs drawn far round it. */
const PIN_CALL_RADII = [snappedRadius(roofGroupsOf([])[0]?.radiusM ?? 0), CALL_RADIUS_MAX_M];

/** One opening's facts every source call reads and adds to. */
export interface CallFacts {
  readonly reader: LeadReader;
  readonly now: number;
  readonly gaps: Set<SiteDataGap>;
  readonly billed: { calls: number };
  /** Whether this opening may ask Google; unset until its first ask. */
  mayAsk?: boolean;
}

/**
 * Each source of a site's data, read through the place's kept answers (`T-M05-002`, part g): a
 * kept answer under 30 days old is served and costs nothing; otherwise the source is asked — a
 * billed one only within the person's cap — and its answer kept. A source that does not answer
 * adds its gap and answers nothing; no opening ever waits on one.
 */
@Injectable()
export class StudioSiteSources {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ROOF_DATA_PORT) private readonly roofData: RoofDataPort,
    @Inject(FAR_HORIZON_SOURCE) private readonly horizons: FarHorizonSource,
    @Inject(BUILDING_OUTLINE_SOURCE) private readonly outlines: BuildingOutlineSource,
    @Inject(FileCacheService) private readonly kept: FileCacheService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StudioSiteSources.name);
  }

  /**
   * Google's straight-down picture round the pin, from the height map kept for the pin's call;
   * none where no map with a picture is kept — it is never asked for on its own.
   */
  async straightDownAt(pin: Coordinate, now: number): Promise<SkyPictureWire> {
    // The map the site data kept for the pin — the sharpest one, or one called where the roofs
    // are — then the pin's own snapped calls.
    const noted = await this.keptOf(keys.pinMap(pin), keptPinMapSchema);
    const at = snapped(pin);
    const tried = [
      ...(noted !== null && fresh(noted, now) ? [noted.key] : []),
      ...PIN_CALL_RADII.map((radiusM) => keys.heightMap(at, radiusM, false)),
    ];
    for (const key of tried) {
      const kept = await this.keptOf(key, keptHeightMapSchema);
      if (kept === null || !fresh(kept, now)) continue;
      const picture = await straightDownOf(kept, pin);
      if (picture !== null) return picture;
    }
    return { kind: 'none', gap: 'not_covered' };
  }

  /** Notes which kept map covers the pin, for its straight-down picture. */
  async notePinMap(pin: Coordinate, key: string, now: number): Promise<void> {
    await this.keep(keys.pinMap(pin), { v: keptVersion, keptAt: now, key });
  }

  get heightsSetUp(): boolean {
    return this.roofData.setUp;
  }

  private readonly openings = new PerMinuteCap(OPENINGS_PER_MINUTE);

  /** Whether this opening may ask Google: decided at its first ask, the same for every other. */
  private mayAsk(call: CallFacts): boolean {
    if (call.mayAsk === undefined) call.mayAsk = this.openings.take(call.reader.actorId, call.now);
    if (!call.mayAsk) call.gaps.add('capped');
    return call.mayAsk;
  }

  /**
   * A kept answer read and checked against its shape, or `null`: none kept, another version, or an
   * outage of the store — a miss, never an error page.
   */
  private async keptOf<T>(key: string, schema: z.ZodType<T>): Promise<T | null> {
    try {
      const read = schema.safeParse(await this.kept.read(key));
      return read.success ? read.data : null;
    } catch (error) {
      this.logger.warn(
        { reason: (error as Error).message },
        'the kept site data could not be read',
      );
      return null;
    }
  }

  private async keep(key: string, value: unknown): Promise<void> {
    try {
      await this.kept.keep(key, value);
    } catch (error) {
      this.logger.warn({ reason: (error as Error).message }, 'the site data could not be kept');
    }
  }

  /** Google's building at a point: kept, else asked, else `null` (said in the gaps). */
  async buildingAt(at: Coordinate, call: CallFacts): Promise<BuildingAnswer | null> {
    const key = keys.building(at);
    const kept = await this.keptOf(key, keptBuildingSchema);
    if (kept !== null && fresh(kept, call.now)) {
      return kept.answer === null ? null : { ...kept.answer, reply: kept.answer.reply ?? null };
    }
    if (!this.mayAsk(call)) return null;
    try {
      const answer = await this.roofData.buildingAt(at, billedTo(call));
      const keptAnswer = answer === null ? null : { ...answer, faces: [...answer.faces] };
      await this.keep(key, {
        v: keptVersion,
        keptAt: call.now,
        answer: keptAnswer,
      } satisfies KeptBuilding);
      return answer;
    } catch (error) {
      this.logger.warn(
        { reason: (error as Error).message },
        'Google’s building data did not answer',
      );
      call.gaps.add('heights_not_answered');
      return null;
    }
  }

  /** Google's height map round a call's middle: kept, else asked and read, else `null`. */
  async heightMapAt(
    at: Coordinate,
    radiusM: number,
    sharpest: boolean,
    call: CallFacts,
  ): Promise<KeptHeightMap | null> {
    const key = keys.heightMap(at, radiusM, sharpest);
    const kept = await this.keptOf(key, z.union([keptNoMapSchema, keptHeightMapSchema]));
    if (kept !== null && fresh(kept, call.now)) {
      if ('none' in kept) {
        call.gaps.add('heights_not_covered');
        return null;
      }
      return kept;
    }
    if (!this.mayAsk(call)) return null;
    try {
      const answer = await this.roofData.heightMapAt(at, radiusM, sharpest, billedTo(call));
      if (answer === null) {
        call.gaps.add('heights_not_covered');
        await this.keep(key, { v: keptVersion, keptAt: call.now, none: true });
        return null;
      }
      const started = Date.now();
      const read = await keptHeightMapOf(at, answer, call.now);
      this.logger.info({ readMs: Date.now() - started, radiusM }, 'a height map was read');
      if (read === null) {
        call.gaps.add('heights_not_covered');
        await this.keep(key, { v: keptVersion, keptAt: call.now, none: true });
        return null;
      }
      await this.keep(key, read);
      return read;
    } catch (error) {
      this.logger.warn({ reason: (error as Error).message }, 'Google’s height map did not answer');
      call.gaps.add('heights_not_answered');
      return null;
    }
  }

  /** Where Google has no height map: OpenStreetMap's buildings round the pin, else none. */
  async outlinesOf(pin: Coordinate, gaps: Set<SiteDataGap>): Promise<HeightsAnswer> {
    if (!this.outlines.setUp) return noHeights();
    try {
      return outlinesAnswerOf(pin, await this.outlines.outlinesNear(pin, OUTLINES_RADIUS_M));
    } catch (error) {
      this.logger.warn(
        { reason: (error as Error).message },
        'the building outlines did not answer',
      );
      gaps.add('outlines_not_answered');
      return noHeights();
    }
  }

  /** The far hills: kept, else asked of PVGIS; `null` over the sea or when it did not answer. */
  async farHorizonOf(
    pin: Coordinate,
    now: number,
    gaps: Set<SiteDataGap>,
  ): Promise<SiteDataWire['farHorizon']> {
    const at = snapped(pin);
    const key = keys.horizon(at);
    let kept = await this.keptOf(key, keptHorizonSchema);
    if (kept === null || !fresh(kept, now)) {
      try {
        const points = await this.horizons.horizonAt(at);
        kept = { v: keptVersion, keptAt: now, points: points === null ? null : [...points] };
        await this.keep(key, kept);
      } catch (error) {
        this.logger.warn({ reason: (error as Error).message }, 'the far horizon did not answer');
        gaps.add('horizon_not_answered');
        return null;
      }
    }
    const skyline =
      kept.points === null ? null : skylineFromSouthBearings(kept.points, SKYLINE_STEP_DEG);
    return skyline === null
      ? null
      : {
          stepDeg: skyline.stepDeg,
          elevationsDeg: skyline.elevationsDeg.map((angle) => Math.round(angle * TENTHS) / TENTHS),
        };
  }
}

/** Counts each call Google bills against the opening, whatever then comes of its answer. */
const billedTo = (call: CallFacts) => () => {
  call.billed.calls += 1;
};
