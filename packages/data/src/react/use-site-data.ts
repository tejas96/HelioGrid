'use client';
import type { SiteDataWire } from '@heliogrid/contracts';
import {
  type Coordinate,
  floorsSet,
  type HeightDataQuality,
  type History,
  heightKeyOf,
  historyAfter,
  historyWithSiteHeights,
  linedUp,
  lineUpCleared,
  lineUpDragged,
  lineUpLifted,
  lineUpNudged,
  lineUpOf,
  type Read,
  type Roof,
  type RoofFacts,
  roofMiddle,
  SITE_DATA_GAPS,
  SITE_DATA_SOURCES,
  type SiteDataGap,
  type SiteDataSource,
  type SiteLineUp,
  type SiteReads,
  type StudioDocument,
  type SunChart,
  siteFitLineOf,
  siteFitOf,
  siteHeightOf,
  siteSayOf,
} from '@heliogrid/domain';
import { roofGroupsOf } from '@heliogrid/domain/studio-kernel';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useContext, useEffect, useMemo, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';
import { SiteReaderContext, type SiteRoofReader } from './site-readers';
import { heightLayersOf, sunChartFor } from './site-surface';
import type { StudioPicture } from './studio-document-state';
import type { StudioSaveState } from './studio-save-queue';
import { useAutomaticLineUp } from './use-automatic-line-up';
import { useSiteSunlight } from './use-site-sunlight';
import { useTenantId } from './use-tenant-id';

/**
 * The site data a studio opens with (`T-M05-002`, part g): fetched once the design's place is
 * known, again when a roof is drawn where no call has reached — after that roof is saved, since the
 * api reads the stored roofs — and each drawn roof read on it off the screen's thread.
 */

type RoofShape = Pick<Roof, 'id' | 'corners'>;

/** Where the calls for these roofs stand: a roof drawn in a new place asks for a new call. */
function coverageOf(roofs: readonly Roof[]): string {
  const standing = roofs.filter((roof) => roof.on === undefined && roof.partOf === undefined);
  return roofGroupsOf(standing.map((roof) => roofMiddle(roof.corners)))
    .map(
      (group) =>
        `${Math.round(group.middle.east)},${Math.round(group.middle.north)},${group.radiusM}`,
    )
    .join(';');
}

const QUALITIES: readonly string[] = ['high', 'medium', 'base'];

export function useSiteData(input: {
  readonly designId: string;
  readonly ready: boolean;
  readonly roofs: readonly Roof[] | null;
  /** The line-up in force: the person's, else the studio's own. */
  readonly lineUp: SiteLineUp | null;
  /** No change waits to be saved: the api reads the roofs as stored. */
  readonly saved: boolean;
  readonly reader: SiteRoofReader;
}): {
  read: Read<SiteDataWire>;
  reads: SiteReads | null;
  retry: () => void;
  shape: readonly RoofShape[];
} {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const roofs = input.roofs;
  const coverage = useMemo(() => (roofs === null ? null : coverageOf(roofs)), [roofs]);
  const query = useQuery({
    queryKey: [...queryKeys.studio.design(tenantId, input.designId), 'site-data', coverage],
    queryFn: ({ signal }) => repositories.studio.siteData(input.designId, signal),
    enabled: tenantId !== '' && input.ready && coverage !== null && input.saved,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    placeholderData: keepPreviousData,
  });
  const data = query.data;
  const [reads, setReads] = useState<SiteReads | null>(null);
  // The roofs' shapes, the same object while no corner moves: a height laid in changes nothing here.
  const shapeKey = JSON.stringify((roofs ?? []).map(({ id, corners }) => ({ id, corners })));
  const shape = useMemo(() => JSON.parse(shapeKey) as RoofShape[], [shapeKey]);
  const lineUp = input.lineUp ?? undefined;
  const lineUpKey = JSON.stringify(lineUp ?? null);
  const { reader } = input;
  // biome-ignore lint/correctness/useExhaustiveDependencies: the reads follow the roofs' shapes and the line-up, by value
  useEffect(() => {
    if (data === undefined || data.source !== 'google_solar') {
      setReads(null);
      return;
    }
    let live = true;
    const quality = QUALITIES.includes(data.quality ?? '')
      ? (data.quality as HeightDataQuality)
      : null;
    void reader({ areas: data.areas, buildings: data.buildings, roofs: shape, lineUp }).then(
      (read) => {
        if (!live) return;
        const stamp = { source: 'google_solar', quality, dataOn: data.dataOn } as const;
        setReads({ stamp, roofs: read, shape });
      },
    );
    return () => {
      live = false;
    };
  }, [data, shapeKey, lineUpKey, reader]);
  return { read: readOf(query), reads, retry: () => void query.refetch(), shape };
}

/**
 * The site data, and each drawn roof standing at the height map's height: laid into every state of
 * the history, never saved for a read alone — the next change saves it with the design (`F4-15`).
 */
export function useSiteHeights(input: {
  readonly designId: string;
  readonly ready: boolean;
  readonly history: History<StudioDocument> | null;
  readonly latest: { current: History<StudioDocument> | null };
  readonly setHistory: (next: History<StudioDocument>) => void;
  readonly saving: StudioSaveState;
  readonly facts: RoofFacts;
  /** A person's change, saved; refused where the reader may not edit. */
  readonly change: (next: History<StudioDocument>) => void;
  /** The design as this opening read it. */
  readonly documentQuery: { readonly data?: { readonly document: StudioDocument } };
  readonly straightDown: boolean;
  readonly setStraightDown: (on: boolean) => void;
  /** The site's pin: the sun chart's place. */
  readonly pin: Coordinate | null;
  /** The picture on show: the studio lines the map up with the sky picture the roofs were drawn on. */
  readonly picture: StudioPicture;
  /** LiDAR shows the year's sunlight on the roofs. */
  readonly sunlightOn: boolean;
}) {
  const { history, latest, setHistory, facts } = input;
  const readers = useContext(SiteReaderContext);
  const document = history?.present ?? null;
  const [straightDownGrid, setStraightDownGrid] = useState<SiteDataWire['straightDown']>(null);
  const automatic = useAutomaticLineUp({
    document,
    picture: input.picture,
    straightDown: straightDownGrid,
    reader: readers.lineUp,
  });
  const site = useSiteData({
    designId: input.designId,
    ready: input.ready,
    roofs: document?.roofs ?? null,
    lineUp: document === null ? null : lineUpOf(document, automatic),
    saved: input.saving.kind === 'saved',
    reader: readers.roofs,
  });
  const straight = site.read.kind === 'ready' ? site.read.value.straightDown : null;
  useEffect(() => setStraightDownGrid(straight), [straight]);
  useEffect(() => {
    if (history === null) return;
    const next = historyWithSiteHeights(history, site.reads, facts);
    if (next === history) return;
    latest.current = next;
    setHistory(next);
  }, [history, site.reads, facts, latest, setHistory]);
  // The site's eaves: the heights a roof's height slider pulls to.
  const data = site.read.kind === 'ready' ? site.read.value : null;
  // Moved with the map by the line-up in force, as the roofs' reads are.
  const lineUp = document === null ? null : lineUpOf(document, automatic);
  const eaves = useMemo(() => {
    const by = lineUp ?? NO_SHIFT;
    return (data?.eaves ?? []).map((eave) => ({
      from: linedUp(eave.from, by),
      to: linedUp(eave.to, by),
      heightM: eave.heightM + by.lift,
    }));
  }, [data, lineUp]);
  // The data the heights were made from, as saved before this opening: newer data says so once.
  const stampBefore = input.documentQuery.data?.document.site?.dataStamp;
  const say = useMemo(
    () =>
      document === null || data === null
        ? null
        : siteSayOf({
            document,
            source: isSource(data.source) ? data.source : 'none',
            dataOn: data.dataOn,
            gaps: data.gaps.filter(isGap),
            reads: site.reads,
            ...(stampBefore === undefined ? {} : { stampBefore }),
          }),
    [document, data, site.reads, stampBefore],
  );
  // Every area's grids, read back once: the sun's shadows and LiDAR's scan read them, and the
  // Heights key reads the sharp ones.
  const areas = data?.areas ?? null;
  const layers = useMemo(() => (areas === null ? [] : heightLayersOf(areas)), [areas]);
  const key = useMemo(() => {
    const sharp = layers.filter((layer) => layer.skip === null);
    return heightKeyOf(sharp.flatMap((layer) => Array.from(layer.grid.heights)));
  }, [layers]);
  // Each roof's chart is worked out once for the data and the design it was asked of.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new map each time the grids or the design change
  const charts = useMemo(() => new Map<string, SunChart | null>(), [layers, document]);
  const chartOf = (roof: number, topM: number) => {
    const corners = document?.roofs[roof]?.corners;
    if (corners === undefined || data === null || input.pin === null) return null;
    const key = `${roof}:${topM}`;
    if (!charts.has(key)) charts.set(key, sunChartFor(layers, data, corners, topM, input.pin));
    return charts.get(key) ?? null;
  };
  const sunlight = useSiteSunlight({
    on: input.sunlightOn,
    data,
    roofs: site.shape,
    pin: input.pin,
    reader: readers.sunlight,
  });
  const edit = (made: (now: StudioDocument) => StudioDocument) => {
    const now = latest.current;
    if (now === null) return;
    // An edit that changes nothing (a tap on the map, a drag back where it began) is no change.
    const next = made(now.present);
    if (next !== now.present) input.change(historyAfter(now, next));
  };
  return {
    ...site,
    /** The buildings' eaves, moved with the map by the person's line-up. */
    eaves,
    say,
    /** "Has the building changed?": the person's yes or no for the data of this date. */
    /** A floors chip: G, G+1, G+2 or G+3 on every roof on the ground. */
    setFloors: (floorsAbove: number) => edit((now) => floorsSet(now, floorsAbove, facts)),
    /** The data's own height for a roof, which Reset brings back; `null` with none. */
    heightOf: (design: StudioDocument, index: number) =>
      siteHeightOf(design, index, site.reads, facts),
    /** What the open sheet says of the map, for roof `roof` standing at `metres`. */
    fitOf: (roof: number, metres: number) => {
      const fit = document === null ? null : siteFitOf(document, roof, metres, site.reads, facts);
      const line = siteFitLineOf(fit);
      return fit === null || line === null ? null : { ...fit, line };
    },
    /** How far the map is moved onto the picture: what the map draws or casts follows it. */
    lineUp: lineUp ?? NO_SHIFT,
    /** The studio's own line-up; `null` where it found none, or has not yet. */
    automatic,
    /** Every area's grids: the height map's shadows are cast from the sharp ones. */
    layers,
    /** The Heights key's two ends, in metres above the ground; `null` with no heights. */
    key,
    /** Each roof's sunlight while LiDAR shows it; `null` until it comes. */
    sunlight,
    /** The sun chart seen from roof `roof`'s middle at its top, `topM` (board G10). */
    sunChartOf: chartOf,
    /** The person lines the map up: lifted, moved by an arrow's way or a drag, or back. */
    liftMap: (lift: number) => edit((now) => lineUpLifted(now, lift, automatic)),
    nudgeMap: (way: { east: number; north: number }) =>
      edit((now) => lineUpNudged(now, way, automatic)),
    dragMap: (to: { east: number; north: number }) =>
      edit((now) => lineUpDragged(now, to, automatic)),
    mapBack: () => edit(lineUpCleared),
    /** Google's straight-down picture shows, for this opening; it is a sky picture of Google's. */
    straightDown: input.straightDown,
    showStraightDown: (on: boolean) => {
      input.setStraightDown(on);
      if (on && latest.current?.present.picture !== 'sky')
        edit((now) => ({ ...now, picture: 'sky' }));
    },
  };
}

/** The map as it came: not moved onto the picture. */
const NO_SHIFT: SiteLineUp = { east: 0, north: 0, lift: 0 };
const isSource = (name: string): name is SiteDataSource =>
  (SITE_DATA_SOURCES as readonly string[]).includes(name);
const isGap = (name: string): name is SiteDataGap =>
  (SITE_DATA_GAPS as readonly string[]).includes(name);
