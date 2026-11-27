'use client';
import type { SiteDataWire, SkyPicturePiece } from '@heliogrid/contracts';
import type { Read, SiteLineUp, StudioDocument } from '@heliogrid/domain';
import type { BuildingScanFit, DrawnBuilding } from '@heliogrid/domain/studio-kernel';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import type { LidarMesh, LidarScan } from './lidar-view';
import type { HeightLayer } from './site-layer';
import { type SiteFitReader, SiteReaderContext, type SiteScanReader } from './site-readers';
import { useTenantId } from './use-tenant-id';

/**
 * LiDAR's scan (`T-M05-002g`): whether it is here, the straight-down photo it wears, and where it
 * sees each drawn building — asked off the page's thread while LiDAR is on, again when a roof or the
 * line-up changes, an answer to an older ask dropped.
 */

/** Where LiDAR stands: the scan in, on its way, unreached, or none at this place. */
export function scanOf(read: Read<SiteDataWire>): LidarScan {
  if (read.kind === 'loading') return 'coming';
  if (read.kind !== 'ready') return 'unreached';
  const data = read.value;
  return data.source === 'google_solar' && data.areas.length > 0 ? 'in' : 'none';
}

/** The scan's mesh, built once for the grids while LiDAR is on and kept for the opening. */
function useScanMesh(
  on: boolean,
  layers: readonly HeightLayer[],
  reader: SiteScanReader,
  failed: boolean,
  fail: () => void,
): LidarMesh | null {
  const [built, setBuilt] = useState<{ readonly of: object; readonly mesh: LidarMesh } | null>(
    null,
  );
  const ready = built !== null && built.of === layers;
  useEffect(() => {
    if (!on || ready || failed || layers.length === 0) return;
    let live = true;
    void reader(layers.map(({ grid, skip }) => ({ grid, skip }))).then((mesh) => {
      if (!live) return;
      if (mesh === null) fail();
      else setBuilt({ of: layers, mesh });
    });
    return () => {
      live = false;
    };
  }, [on, ready, failed, layers, reader, fail]);
  return ready ? built.mesh : null;
}

export function useLidarScan(input: {
  readonly designId: string;
  readonly on: boolean;
  /**
   * The fits are wanted with LiDAR off too: the top view on the straight-down picture says when
   * roofs sit off their spot (board frame 20).
   */
  readonly fitsWanted: boolean;
  readonly read: Read<SiteDataWire>;
  readonly document: StudioDocument | null;
  readonly buildings: readonly DrawnBuilding[];
  readonly lineUp: SiteLineUp;
  /** Every area's grids: the scan's mesh is built from them. */
  readonly layers: readonly HeightLayer[];
}): {
  readonly scan: LidarScan;
  readonly mesh: LidarMesh | null;
  readonly photo: readonly SkyPicturePiece[] | null;
  readonly fits: readonly BuildingScanFit[] | null;
  /**
   * The fits last answered, for the roofs as they were then: what says roofs sit off their spot
   * reads them, so it holds steady while new ones are worked out. Match never does.
   */
  readonly lastFits: readonly BuildingScanFit[] | null;
  /** After the scan's maths broke (its worker failed): ask again. */
  readonly retry: () => void;
} {
  const { on, read, document, buildings, lineUp } = input;
  const repositories = useRepositories();
  const readers = useContext(SiteReaderContext);
  const tenantId = useTenantId();
  const scan = scanOf(read);
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);
  const live = on && scan === 'in';
  const fitting = (on || input.fitsWanted) && scan === 'in';
  // The straight-down photo: the sky picture route's, the same read the picture panel shows.
  const photoQuery = useQuery({
    queryKey: [...queryKeys.studio.design(tenantId, input.designId), 'sky-picture', true],
    queryFn: ({ signal }) =>
      repositories.studio.skyPicture(input.designId, signal, 'straight_down'),
    enabled: tenantId !== '' && live,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
  const photo = photoQuery.data?.kind === 'picture' ? photoQuery.data.pieces : null;

  const wire = read.kind === 'ready' ? read.value : null;
  const ask = useMemo((): Parameters<SiteFitReader>[0] | null => {
    if (wire === null || document === null) return null;
    const shape = (i: number) => {
      const roof = document.roofs[i];
      return roof === undefined ? [] : [{ id: roof.id, corners: roof.corners }];
    };
    return {
      areas: wire.areas,
      buildings: wire.buildings,
      drawn: buildings.map((building) => ({
        ground: building.roofs.flatMap(shape),
        members: building.members.flatMap(shape),
      })),
      lineUp,
    };
  }, [wire, document, buildings, lineUp]);
  // The fits and the ask they answer: they count only for the roofs and the line-up asked of.
  const [answered, setAnswered] = useState<{
    readonly ask: object;
    readonly fits: readonly BuildingScanFit[];
  } | null>(null);
  useEffect(() => {
    // Off and not wanted, they are forgotten.
    if (!on && !input.fitsWanted) {
      setAnswered(null);
      return;
    }
    if (!fitting || failed || ask === null) return;
    let current = true;
    void readers.fits(ask).then((answer) => {
      if (!current) return;
      if (answer.length === ask.drawn.length) setAnswered({ ask, fits: answer });
      // A broken worker answers nothing for buildings that stand: the scan failed.
      else if (ask.drawn.length > 0) fail();
    });
    return () => {
      current = false;
    };
  }, [on, input.fitsWanted, fitting, failed, ask, readers, fail]);
  const mesh = useScanMesh(live, input.layers, readers.scan, failed, fail);
  // A move made since they were worked out leaves them stale: Match waits for the new ones.
  const fits = answered !== null && answered.ask === ask ? answered.fits : null;
  // The scan is in once its mesh is built: until then its looks and Move wait.
  const shown: LidarScan =
    scan !== 'in' ? scan : failed ? 'failed' : mesh === null ? 'coming' : 'in';
  return {
    scan: shown,
    photo,
    fits,
    lastFits: answered?.fits ?? null,
    mesh,
    retry: () => setFailed(false),
  };
}
