import {
  SKY_TILE_UNAVAILABLE,
  type SkyPictureWire,
  type SkyTilesWire,
  studioDocumentSchema,
} from '@heliogrid/contracts';
import {
  EMPTY_STUDIO_DOCUMENT,
  type MarketPack,
  type SkyTileKey,
  skyRealDetailMetres,
  skyTileAllowed,
  skyTileRange,
  skyTileReach,
  skyTileZoomMin,
} from '@heliogrid/domain';
import {
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ContractException } from '../../common/errors/contract-exception';
import { ENV } from '../../config/env';
import type { LeadReader } from '../crm/crm.public';
import { SettingsService } from '../settings/settings.public';
import {
  SKY_PICTURE_SOURCE,
  type SkyPictureSource,
  type SourceMarket,
  type SourcePiece,
  type SourceTile,
} from './internal/sky-picture-source';
import { mintSkyTicket, readSkyTicket } from './internal/sky-ticket';
import { StudioDocumentRepository } from './studio.document.repository';
import { StudioRepository } from './studio.repository';

/** A piece of picture as it travels: the image itself, and the ground it covers. */
const wirePiece = ({ bytes, mediaType, ...ground }: SourcePiece) => ({
  image: `data:${mediaType};base64,${bytes.toString('base64')}`,
  ...ground,
});

/**
 * The whole pictures a person may fetch in a minute. Each is billable at the provider, so a reload
 * loop is capped: past it the studio opens on its grid and says the picture did not load.
 */
const PICTURES_PER_MINUTE = 12;
/**
 * The tiles a person may fetch in a minute: each is billable at the provider. A studio opens on
 * about a dozen and a fast move across a whole site asks for a few dozen more; a loop is stopped.
 */
const TILES_PER_MINUTE = 300;
const MINUTE_MS = 60_000;

/** The market a picture is asked for in: the pack's country, and its locale less its number pin. */
const marketOf = (pack: MarketPack): SourceMarket => ({
  region: pack.market,
  language: pack.formats.locale.split('-u-')[0] ?? pack.formats.locale,
});

/**
 * How long the reader's own browser may keep a tile: as long as the provider says, and no cache
 * between the reader and this api ever — a tile's address carries no ticket and no session, so a
 * shared cache would hand it to anyone. A provider that says nothing is kept by no one.
 */
export function browserOnly(cacheControl: string | null): string {
  const seconds = /(?:^|[,\s])max-age=(\d+)/i.exec(cacheControl ?? '')?.[1];
  return seconds === undefined ? 'no-store' : `private, max-age=${seconds}`;
}

/** How many of one thing each person took inside the last minute. Held in memory only. */
class MinuteCap {
  private readonly taken = new Map<string, number[]>();

  constructor(private readonly most: number) {}

  /** Whether the person may take one more now; counts it when they may. */
  take(userId: string, now: number): boolean {
    const recent = (this.taken.get(userId) ?? []).filter((at) => now - at < MINUTE_MS);
    if (recent.length >= this.most) {
      this.taken.set(userId, recent);
      return false;
    }
    this.taken.set(userId, [...recent, now]);
    return true;
  }
}

/**
 * The sky picture a design's studio opens on (`T-M05-002a`), read by whoever may read the design's
 * lead: what the picture is and the ticket its tiles are asked with, each tile as the provider
 * gives it, and — for a studio built before the tiles — the whole picture at once. Nothing of it
 * is ever stored. A provider that does not answer is a state the studio draws, never an error page.
 */
@Injectable()
export class StudioSkyPictureService {
  private readonly pictureCap = new MinuteCap(PICTURES_PER_MINUTE);
  private readonly tileCap = new MinuteCap(TILES_PER_MINUTE);

  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(StudioRepository) private readonly designs: StudioRepository,
    @Inject(StudioDocumentRepository) private readonly documents: StudioDocumentRepository,
    @Inject(SKY_PICTURE_SOURCE) private readonly pictures: SkyPictureSource,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StudioSkyPictureService.name);
  }

  /** The answer of one ask of the provider, or `undefined` when it gave none. */
  private async asked<Answer>(ask: () => Promise<Answer>): Promise<Answer | undefined> {
    try {
      return await ask();
    } catch (error) {
      // The message alone: a request to the provider can carry its key, which is never logged.
      const reason = error instanceof Error ? error.message : 'unknown';
      this.logger.warn({ reason }, 'the sky picture source did not answer');
      return undefined;
    }
  }

  /**
   * What the site's picture is, and the ticket its tiles are asked with: the zooms the picture is
   * worth asking at — never past the market's own cap on true detail — and the ground round the
   * pin and the roofs it may be fetched for.
   */
  async tiles(reader: LeadReader, designId: string): Promise<SkyTilesWire> {
    const facts = await this.designs.factsOf(reader, designId);
    if (facts === null) throw new NotFoundException('No such design.');
    const pin = facts.site.pin;
    if (pin === null) return { kind: 'none', gap: 'not_covered' };
    if (!this.pictures.setUp) return { kind: 'none', gap: 'not_set_up' };
    const [pack, stored] = await Promise.all([
      this.settings.packOf(reader.tenantId),
      this.documents.documentOf(reader, designId),
    ]);
    const market = marketOf(pack);
    const seen = await this.asked(() => this.pictures.factsAt(pin, market));
    if (seen === undefined) return { kind: 'none', gap: 'not_answered' };
    if (seen === null) return { kind: 'none', gap: 'not_covered' };
    const document =
      stored == null ? EMPTY_STUDIO_DOCUMENT : studioDocumentSchema.parse(stored.body);
    const zoomMax = Math.min(seen.zoomMax, pack.formats.skyPictureRealZoomMax ?? seen.zoomMax);
    const reach = skyTileReach(facts.design.mount, {
      roofs: document.roofs,
      pictureScale: document.pictureScale,
      land: null,
    });
    const zoomMin = skyTileZoomMin(pin.latitude, reach, zoomMax);
    const { ticket, until } = mintSkyTicket(
      ENV.AUTH_TOKEN_SECRET,
      {
        tenantId: reader.tenantId,
        designId,
        userId: reader.actorId,
        zoomMin,
        zoomMax,
        reach: skyTileRange(pin, reach, zoomMax),
        ...market,
      },
      Date.now(),
    );
    return {
      kind: 'tiles',
      source: seen.source,
      credit: seen.credit,
      metresPerPixel: skyRealDetailMetres(pin.latitude, zoomMax),
      takenOn: seen.takenOn,
      ticket,
      ticketUntil: until.toISOString(),
      zoomMin,
      zoomMax,
      reach,
    };
  }

  /**
   * One tile, for the reader and the design its ticket names. The ticket is what says the reader
   * may read the design, so no record is read here: a ticket this api did not sign, or one that ran
   * out, is refused; another reader's, another design's, a tile past the reach or off its zooms is
   * not found.
   */
  async tile(
    reader: LeadReader,
    designId: string,
    key: SkyTileKey,
    ticket: string,
  ): Promise<SourceTile & { readonly cacheControl: string }> {
    const now = Date.now();
    const said = readSkyTicket(ENV.AUTH_TOKEN_SECRET, ticket, now);
    if (said === null) throw new ForbiddenException('This ticket is not valid.');
    const theirs =
      said.tenantId === reader.tenantId &&
      said.userId === reader.actorId &&
      said.designId === designId;
    if (!theirs) throw new NotFoundException('No such design.');
    if (!skyTileAllowed(key, said.reach, said)) throw new NotFoundException('No such tile.');
    if (!this.tileCap.take(reader.actorId, now)) {
      this.logger.warn({ designId }, 'the sky tile cap was reached for a person');
      throw new ContractException(
        'RATE_LIMITED',
        'Too many tiles were asked for. Try again in a minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const tile = await this.asked(() =>
      this.pictures.tile(key, { region: said.region, language: said.language }),
    );
    if (tile === undefined) {
      throw new ContractException(
        SKY_TILE_UNAVAILABLE,
        'The map service did not answer.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (tile === null) throw new NotFoundException('No such tile.');
    return { ...tile, cacheControl: browserOnly(tile.cacheControl) };
  }

  /** The whole picture of the design's site, asked of the provider now. */
  async whole(reader: LeadReader, designId: string): Promise<SkyPictureWire> {
    const facts = await this.designs.factsOf(reader, designId);
    if (facts === null) throw new NotFoundException('No such design.');
    const pin = facts.site.pin;
    if (pin === null) return { kind: 'none', gap: 'not_covered' };
    if (!this.pictures.setUp) return { kind: 'none', gap: 'not_set_up' };
    if (!this.pictureCap.take(reader.actorId, Date.now())) {
      this.logger.warn({ designId }, 'the sky picture cap was reached for a person');
      return { kind: 'none', gap: 'not_answered' };
    }
    const market = marketOf(await this.settings.packOf(reader.tenantId));
    const picture = await this.asked(() => this.pictures.pictureAt(pin, market));
    if (picture === undefined) return { kind: 'none', gap: 'not_answered' };
    if (picture === null) return { kind: 'none', gap: 'not_covered' };
    return {
      kind: 'picture',
      source: picture.source,
      credit: picture.credit,
      metresPerPixel: picture.metresPerPixel,
      takenOn: picture.takenOn,
      pieces: picture.pieces.map(wirePiece),
      around: picture.around.map(wirePiece),
    };
  }
}
