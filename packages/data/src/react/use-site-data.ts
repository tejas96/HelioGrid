'use client';
import type { SiteDataWire } from '@heliogrid/contracts';
import {
  type Coordinate,
  floorsSet,
  HEIGHT_VIEW_START,
  type HeightDataQuality,
  type HeightView,
  type History,
  heightKeyOf,
  historyAfter,
  historyWithSiteHeights,
  linedUp,
  lineUpCleared,
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
  type SiteDataKept,
  type SiteDataSource,
  type SiteLineUp,
  type SiteReads,
  type StudioDocument,
  type SunChart,
  siteChangedAnswered,
  siteFitLineOf,
  siteFitOf,
  siteHeightOf,
  siteSayOf,
  siteSnapTargets,
} from '@heliogrid/domain';
import { roofGroupsOf } from '@heliogrid/domain/studio-kernel';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useContext, useEffect, useMemo, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';
import { SiteReaderContext, type SiteRoofReader } from './site-readers';
import { heightLayersOf, sunChartFor } from './site-surface';
import type { StudioSaveState } from './studio-save-queue';
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
  readonly site: SiteDataKept | undefined;
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
  const lineUp = input.site?.lineUp;
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
        setReads({ stamp: { source: 'google_solar', quality, dataOn: data.dataOn }, roofs: read });
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
}) {
  const { history, latest, setHistory, facts } = input;
  const readers = useContext(SiteReaderContext);
  // The height view is the person's for this opening.
  const [view, setView] = useState<HeightView>(HEIGHT_VIEW_START);
  const document = history?.present ?? null;
  const site = useSiteData({
    designId: input.designId,
    ready: input.ready,
    roofs: document?.roofs ?? null,
    site: document?.site,
    saved: input.saving.kind === 'saved',
    reader: readers.roofs,
  });
  useEffect(() => {
    if (history === null) return;
    const next = historyWithSiteHeights(history, site.reads, facts);
    if (next === history) return;
    latest.current = next;
    setHistory(next);
  }, [history, site.reads, facts, latest, setHistory]);
  // The site's buildings and their eaves: what a drawn or dragged corner pulls to besides roofs.
  const data = site.read.kind === 'ready' ? site.read.value : null;
  // Moved with the map by the person's line-up, as the roofs' reads are.
  const lineUp = document === null ? null : lineUpOf(document);
  const eaves = useMemo(() => {
    const by = lineUp ?? NO_SHIFT;
    return (data?.eaves ?? []).map((eave) => ({
      from: linedUp(eave.from, by),
      to: linedUp(eave.to, by),
      heightM: eave.heightM + by.lift,
    }));
  }, [data, lineUp]);
  const targets = useMemo(() => {
    if (data === null || data.buildings.length === 0) return undefined;
    const by = lineUp ?? NO_SHIFT;
    return siteSnapTargets({
      outlines: data.buildings.map((building) => building.outline.map((p) => linedUp(p, by))),
      eaves: eaves.map((eave) => ({ ...eave, building: -1 })),
    });
  }, [data, lineUp, eaves]);
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
            today: new Date().toISOString().slice(0, DAY_CHARS),
            ...(stampBefore === undefined ? {} : { stampBefore }),
          }),
    [document, data, site.reads, stampBefore],
  );
  // Every area's grids, read back once: the sun's shadows read them, and the height view's surface
  // — with the key's ends from the sharp ones, the roofs' corners and the line-up — while it is on.
  const heightsOn = view.on && view.mode === 'heights';
  const areas = data?.areas ?? null;
  const layers = useMemo(() => (areas === null ? [] : heightLayersOf(areas)), [areas]);
  // The key reads the grids alone; the surface fades by the roofs' corners, by value.
  const key = useMemo(() => {
    const sharp = layers.filter((layer) => layer.skip === null);
    return heightKeyOf(sharp.flatMap((layer) => Array.from(layer.grid.heights)));
  }, [layers]);
  const near = useMemo(() => site.shape.flatMap((roof) => roof.corners), [site.shape]);
  const surface = useMemo(
    () =>
      !heightsOn || layers.length === 0 || key === null || lineUp === null
        ? null
        : { layers, key, near, lineUp },
    [heightsOn, layers, key, near, lineUp],
  );
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
    on: view.on && view.mode === 'sunlight',
    data,
    roofs: site.shape,
    pin: input.pin,
    reader: readers.sunlight,
  });
  const edit = (made: (now: StudioDocument) => StudioDocument) => {
    const now = latest.current;
    if (now !== null) input.change(historyAfter(now, made(now.present)));
  };
  return {
    ...site,
    targets,
    /** The buildings' eaves, moved with the map by the person's line-up. */
    eaves,
    say,
    /** "Has the building changed?": the person's yes or no for the data of this date. */
    answerChanged: (changed: boolean) =>
      edit((now) => siteChangedAnswered(now, data?.dataOn ?? null, changed)),
    /** A floors chip: G, G+1, G+2 or G+3 on every roof on the ground. */
    setFloors: (floorsAbove: number) => edit((now) => floorsSet(now, floorsAbove, facts)),
    /** The data's own height for a roof, which Reset brings back; `null` with none. */
    heightOf: (design: StudioDocument, index: number) =>
      siteHeightOf(design, index, site.reads, facts),
    /** What the open sheet says of the map, for roof `roof` standing at `metres`. */
    fitOf: (roof: number, metres: number) => {
      const fit = document === null ? null : siteFitOf(document, roof, metres, site.reads, facts);
      const line = siteFitLineOf(fit, heightsOn);
      return fit === null || line === null ? null : { ...fit, line };
    },
    /** The height view: on or off, heights or sunlight, how see-through. */
    view,
    surface,
    /** How far the person moved the map onto the picture: what the map draws or casts follows it. */
    lineUp: lineUp ?? NO_SHIFT,
    /** Every area's grids: the height map's shadows are cast from the sharp ones. */
    layers,
    /** Each roof's sunlight while the view shows it; `null` until it comes. */
    sunlight,
    /** The sun chart seen from roof `roof`'s middle at its top, `topM` (board G10). */
    sunChartOf: chartOf,
    setView: (next: Partial<HeightView>) => setView((now) => ({ ...now, ...next })),
    /** The person lines the map up: lifted, moved by an arrow's way on the ground, or back. */
    liftMap: (lift: number) => edit((now) => lineUpLifted(now, lift)),
    nudgeMap: (way: { east: number; north: number }) => edit((now) => lineUpNudged(now, way)),
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
/** `YYYY-MM-DD`: the first ten characters of an ISO instant. */
const DAY_CHARS = 10;
const isSource = (name: string): name is SiteDataSource =>
  (SITE_DATA_SOURCES as readonly string[]).includes(name);
const isGap = (name: string): name is SiteDataGap =>
  (SITE_DATA_GAPS as readonly string[]).includes(name);
