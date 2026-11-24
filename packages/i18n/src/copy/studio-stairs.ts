import type { TranslatedText } from '@heliogrid/contracts';
import type { StairsDrop, StairsMoment, StairsRow } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { compassWord } from './studio-sheet';

type T = Translator['t'];

/**
 * The stairs (`T-M05-002`, part e, E119–E122, board 7): the bar's lines and its Place, the mark's
 * name, the tag a drag shows, and the stair room's Stairs row.
 */
const STAIRS = {
  placed: /*i18n*/ { id: 'Stairs placed · drag to move' },
  askTitle: /*i18n*/ { id: 'Where do the stairs reach the roof?' },
  askStatus: /*i18n*/ { id: 'Outside stairs or a ladder? Tap Place, then that edge' },
  placing: /*i18n*/ { id: 'Tap the edge where the stairs reach the roof' },
  skip: /*i18n*/ { id: 'Skip' },
  place: /*i18n*/ { id: 'Place' },
  moving: /*i18n*/ { id: 'Moving the stairs' },
  outsideStairs: /*i18n*/ { id: 'Outside stairs' },
  pulledMiddle: /*i18n*/ { id: 'Middle of the side' },
  row: /*i18n*/ { id: 'Stairs' },
  sideFacing: /*i18n*/ { id: 'Side facing {way}' },
  outside: /*i18n*/ { id: 'Outside' },
  none: /*i18n*/ { id: 'Not placed' },
} as const;

/** The stairs' words, part of the studio canvas's (`studioCanvasWords`). */
export function studioStairsWords(t: T) {
  const sideFacing = (row: StairsRow, side: number): TranslatedText | null => {
    const found = row.sides.find((each) => each.side === side);
    return found === undefined ? null : t(STAIRS.sideFacing, { way: compassWord(t, found.faces) });
  };
  return {
    stairsPlaced: t(STAIRS.placed),
    stairsAskTitle: t(STAIRS.askTitle),
    stairsAskStatus: t(STAIRS.askStatus),
    stairsPlacing: t(STAIRS.placing),
    /** The bar's slim line for a stairs moment that is not the question. */
    stairsLine: (moment: Exclude<StairsMoment, 'ask'>): TranslatedText =>
      moment === 'placing'
        ? t(STAIRS.placing)
        : moment === 'moving'
          ? t(STAIRS.moving)
          : t(STAIRS.placed),
    stairsSkip: t(STAIRS.skip),
    stairsPlace: t(STAIRS.place),
    stairsMoving: t(STAIRS.moving),
    /** The tag a held mark shows: on a roof's edge, or what the magnet pulled it to. */
    stairsTag: (drop: StairsDrop): TranslatedText | null => {
      if (drop.outside) return t(STAIRS.outsideStairs);
      return drop.pulled === 'middle' ? t(STAIRS.pulledMiddle) : null;
    },
    rowStairs: t(STAIRS.row),
    /** "Side facing east" for one of the stair room's sides. */
    stairsSide: sideFacing,
    stairsOutside: t(STAIRS.outside),
    /** Where the stairs are now, as the row's value. */
    stairsOn: (row: StairsRow): TranslatedText => {
      if (row.on === 'outside') return t(STAIRS.outside);
      return (row.on === null ? null : sideFacing(row, row.on)) ?? t(STAIRS.none);
    },
  };
}
