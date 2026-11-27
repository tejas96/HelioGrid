import type { TranslatedText } from '@heliogrid/contracts';
import {
  compassWayOf,
  type LidarFoot,
  type LidarHint,
  type LidarStatus,
  type RoofName,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { roofNameWord } from './studio-roof-kinds';
import { compassWord } from './studio-sheet';

type T = Translator['t'];

/**
 * LiDAR's words (`T-M05-002g`, board v17): its button, head and Move sheet, the one instruction
 * under the head and the one message at the foot — each short, so it fits one line on a phone.
 */
const LIDAR = {
  lidar: /*i18n*/ { id: 'LiDAR' },
  lidarOff: /*i18n*/ { id: 'Turn LiDAR off' },
  look: /*i18n*/ { id: 'Look' },
  heights: /*i18n*/ { id: 'Heights' },
  photo: /*i18n*/ { id: 'Photo' },
  move: /*i18n*/ { id: 'Move' },
  moveClose: /*i18n*/ { id: 'Close Move' },
  whatToMove: /*i18n*/ { id: 'What to move' },
  tabRoofs: /*i18n*/ { id: 'Roofs' },
  tabMap: /*i18n*/ { id: 'Scan' },
  buildings: /*i18n*/ { id: 'Buildings' },
  roofsNumbered: /*i18n*/ { id: 'Roofs {numbers}' },
  none: /*i18n*/ { id: 'None' },
  matches: /*i18n*/ { id: 'Matches the scan' },
  offScan: /*i18n*/ { id: 'Off the scan' },
  beyondReach: /*i18n*/ { id: 'Scan: more than {distance} away. Drag the roof onto it.' },
  scanAway: /*i18n*/ { id: 'Scan: {distance} {way}' },
  scanAwayHigh: /*i18n*/ { id: 'Scan: {distance} {way}, {height} high' },
  scanHigh: /*i18n*/ { id: 'Scan: {height} high' },
  match: /*i18n*/ { id: 'Match the scan' },
  whichRoof: /*i18n*/ { id: 'Which roof' },
  heightFromGround: /*i18n*/ { id: 'Height from the ground' },
  lower: /*i18n*/ { id: 'Lower the roof' },
  raise: /*i18n*/ { id: 'Raise the roof' },
  sloped: /*i18n*/ { id: 'Sloped roof: its height stays as drawn.' },
  scanRange: /*i18n*/ { id: 'Scan {low} to {high}' },
  noScanRoof: /*i18n*/ { id: 'No scan roof here' },
  nudge: /*i18n*/ { id: 'Nudge 10 cm' },
  roofsUp: /*i18n*/ { id: 'Move the roofs up' },
  roofsDown: /*i18n*/ { id: 'Move the roofs down' },
  roofsLeft: /*i18n*/ { id: 'Move the roofs left' },
  roofsRight: /*i18n*/ { id: 'Move the roofs right' },
  asDrawn: /*i18n*/ { id: 'Back to as drawn' },
  sunlightLine: /*i18n*/ { id: 'The sun each roof keeps in a year' },
  keyHeights: /*i18n*/ { id: 'Height above the street' },
  keySun: /*i18n*/ { id: 'Sun each roof keeps' },
  hintOpen: /*i18n*/ { id: 'Tap a roof to check its height.' },
  hintReader: /*i18n*/ { id: 'Tap a roof to see its height.' },
  hintMap: /*i18n*/ { id: 'Drag the scan under your roofs.' },
  hintMapEdge: /*i18n*/ { id: 'The scan moves {distance} at most. Move the roof onto it instead.' },
  hintPick: /*i18n*/ { id: 'Tap a building to move it.' },
  hintDrag: /*i18n*/ { id: 'Drag a picked roof to move it.' },
  hintHold: /*i18n*/ { id: 'Hold a picked roof, then drag.' },
  hintNowDrag: /*i18n*/ { id: 'Now drag.' },
  hintMoving: /*i18n*/ { id: 'Moving {distance}' },
  hintOnScan: /*i18n*/ { id: 'On the scan' },
  footMoved: /*i18n*/ { id: 'Moved {distance}' },
  footOff: /*i18n*/ { id: 'Some roofs sit off their true spot.' },
  footOffShort: /*i18n*/ { id: 'Some roofs sit off.' },
  fix: /*i18n*/ { id: 'Fix' },
  fixInLidar: /*i18n*/ { id: 'Fix in LiDAR' },
  hide: /*i18n*/ { id: 'Hide' },
  loading: /*i18n*/ { id: 'Loading the 3D scan…' },
  offlineTitle: /*i18n*/ { id: 'You’re offline' },
  offlineLine: /*i18n*/ { id: 'LiDAR needs the internet to open. Your design is safe.' },
  failed: /*i18n*/ { id: 'The 3D scan did not open.' },
  noData: /*i18n*/ { id: 'No height data here' },
  noDataLine: /*i18n*/ {
    id: 'Google has no 3D scan of this place. Your roofs keep their heights.',
  },
  cardHeight: /*i18n*/ { id: 'Height from the ground' },
  cardScan: /*i18n*/ { id: 'The scan' },
  cardNoRoof: /*i18n*/ { id: 'No roof here' },
  cardSun: /*i18n*/ { id: 'Sun kept' },
} as const;

/** The instruction under the head; `phone`: a roof is dragged after a hold there. */
function hintWord(t: T, hint: LidarHint, phone: boolean, distance: string): TranslatedText {
  switch (hint.kind) {
    case 'open':
      return t(LIDAR.hintOpen);
    case 'reader':
      return t(LIDAR.hintReader);
    case 'map':
      return t(LIDAR.hintMap);
    case 'map_edge':
      return t(LIDAR.hintMapEdge, { distance });
    case 'pick':
      return t(LIDAR.hintPick);
    case 'drag':
      return t(phone ? LIDAR.hintHold : LIDAR.hintDrag);
    case 'now_drag':
      return t(LIDAR.hintNowDrag);
    case 'on_scan':
      return t(LIDAR.hintOnScan);
    default:
      return t(LIDAR.hintMoving, { distance });
  }
}

/** LiDAR's words, part of the studio canvas's (`studioCanvasWords`). */
export function studioLidarWords(t: T) {
  return {
    lidar: t(LIDAR.lidar),
    lidarOff: t(LIDAR.lidarOff),
    lidarLook: t(LIDAR.look),
    lidarHeights: t(LIDAR.heights),
    lidarPhoto: t(LIDAR.photo),
    lidarMove: t(LIDAR.move),
    lidarMoveClose: t(LIDAR.moveClose),
    lidarWhatToMove: t(LIDAR.whatToMove),
    lidarTabRoofs: t(LIDAR.tabRoofs),
    lidarTabMap: t(LIDAR.tabMap),
    lidarBuildings: t(LIDAR.buildings),
    /** A building's chip: its one roof's name, or "Roofs 1 + 2". */
    lidarBuilding: (names: readonly RoofName[]): TranslatedText => {
      const [first] = names;
      if (names.length === 1 && first !== undefined) return roofNameWord(t, first);
      const numbers = names.flatMap((name) => (name.kind === 'roof' ? [name.number] : []));
      return t(LIDAR.roofsNumbered, { numbers: numbers.join(' + ') });
    },
    lidarNone: t(LIDAR.none),
    /**
     * Where the picked roofs stand against the scan, in one line; `distance` and `height` already
     * formatted in the reader's units.
     */
    lidarStatus: (
      status: LidarStatus,
      distance: (metres: number) => string,
      height: (metres: number) => string,
    ): TranslatedText => {
      if (status.kind === 'matches') return t(LIDAR.matches);
      if (status.kind === 'beyond_reach') {
        return t(LIDAR.beyondReach, { distance: distance(status.reachM) });
      }
      const { shift, scanHeightM } = status;
      if (shift === null) {
        return scanHeightM === null
          ? t(LIDAR.offScan)
          : t(LIDAR.scanHigh, { height: height(scanHeightM) });
      }
      const away = {
        distance: distance(Math.hypot(shift.east, shift.north)),
        way: compassWord(t, compassWayOf(shift)),
      };
      return scanHeightM === null
        ? t(LIDAR.scanAway, away)
        : t(LIDAR.scanAwayHigh, { ...away, height: height(scanHeightM) });
    },
    lidarMatch: t(LIDAR.match),
    lidarWhichRoof: t(LIDAR.whichRoof),
    lidarRoofName: (name: RoofName) => roofNameWord(t, name),
    lidarHeight: t(LIDAR.heightFromGround),
    lidarLower: t(LIDAR.lower),
    lidarRaise: t(LIDAR.raise),
    lidarSloped: t(LIDAR.sloped),
    lidarScanRange: (low: string, high: string) => t(LIDAR.scanRange, { low, high }),
    lidarNoScanRoof: t(LIDAR.noScanRoof),
    lidarNudge: t(LIDAR.nudge),
    lidarRoofsUp: t(LIDAR.roofsUp),
    lidarRoofsDown: t(LIDAR.roofsDown),
    lidarRoofsLeft: t(LIDAR.roofsLeft),
    lidarRoofsRight: t(LIDAR.roofsRight),
    lidarAsDrawn: t(LIDAR.asDrawn),
    lidarSunlightLine: t(LIDAR.sunlightLine),
    lidarKeyHeights: t(LIDAR.keyHeights),
    lidarKeySun: t(LIDAR.keySun),
    /** The instruction under the head; `distance` is a drag's, already formatted. */
    lidarHint: (hint: LidarHint, phone: boolean, distance: string) =>
      hintWord(t, hint, phone, distance),
    /** The foot's line: moved how far, or roofs off their spot (shorter on a phone). */
    lidarFoot: (foot: LidarFoot, phone: boolean, distance: string): TranslatedText => {
      if (foot.kind === 'moved') return t(LIDAR.footMoved, { distance });
      return t(phone ? LIDAR.footOffShort : LIDAR.footOff);
    },
    lidarFix: t(LIDAR.fix),
    lidarFixInLidar: t(LIDAR.fixInLidar),
    lidarHide: t(LIDAR.hide),
    lidarLoading: t(LIDAR.loading),
    lidarOfflineTitle: t(LIDAR.offlineTitle),
    lidarOfflineLine: t(LIDAR.offlineLine),
    lidarFailed: t(LIDAR.failed),
    lidarNoData: t(LIDAR.noData),
    lidarNoDataLine: t(LIDAR.noDataLine),
    lidarCardHeight: t(LIDAR.cardHeight),
    lidarCardScan: t(LIDAR.cardScan),
    lidarCardNoRoof: t(LIDAR.cardNoRoof),
    lidarCardSun: t(LIDAR.cardSun),
  };
}
