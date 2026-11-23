/**
 * `T-M05-002`, part e — what a market's roofs usually measure, and which roof types it meets
 * first. A design starts each value here, `assumed`, until a person sets it. Every value has a
 * default in the code (`ROOF_FACTS_DEFAULT`), so a pack stored before it still opens.
 */

/** Where a setback is measured on a sloped roof: along the face, or as seen from above. */
export const SETBACK_MEASURES = ['along_face', 'from_above'] as const;
export type SetbackMeasure = (typeof SETBACK_MEASURES)[number];

/**
 * A setback of its own for a kind of edge, in metres, as fire rules give; `null` follows the
 * market's one setback.
 */
export interface SetbackByEdge {
  readonly eave: number | null;
  readonly ridge: number | null;
  readonly hipOrValley: number | null;
  readonly gableEnd: number | null;
}

export interface RoofMarketFacts {
  /** The ground floor's floor above the ground, in metres: floor G's roof is this plus a storey. */
  readonly plinthHeightM: number;
  /** A stair room's height above the roof it stands on, and an open shed's over a roof. */
  readonly stairRoomHeightM: number;
  /** A parapet's height above the roof's floor. */
  readonly parapetHeightM: number;
  readonly wallThicknessM: number;
  /** How far a sloped roof's drip edge lies past its walls. */
  readonly overhangM: number;
  /** Panels keep this far in from the inside of the parapet, or from the edge where there is none. */
  readonly setbackM: number;
  readonly setbackByEdge: SetbackByEdge | null;
  readonly setbackMeasure: SetbackMeasure;
  /** The clear path kept in front of the stairs. */
  readonly clearPathM: number;
  /**
   * Roof type names (the studio's `ROOF_MATERIALS`) in the order the market meets them: the first
   * five are the picker's tiles. A name the studio does not know is passed over.
   */
  readonly materialOrder: readonly string[];
  /** A roof type's first slope in degrees, by its name, where the market's differs from the studio's. */
  readonly firstSlopeDeg: Readonly<Record<string, number>>;
  /** An open shed's first slope, in degrees: a sheet on posts, sloped one way. */
  readonly openShedSlopeDeg: number;
}

/** What a pack stored before these facts reads: a common masonry house, with no order of its own. */
export const ROOF_FACTS_DEFAULT: RoofMarketFacts = {
  plinthHeightM: 0,
  stairRoomHeightM: 3,
  parapetHeightM: 1,
  wallThicknessM: 0.2,
  overhangM: 0.5,
  setbackM: 0.5,
  setbackByEdge: null,
  setbackMeasure: 'along_face',
  clearPathM: 0.75,
  materialOrder: [],
  firstSlopeDeg: {},
  openShedSlopeDeg: 6,
};

/**
 * India. A metal sheet roof slopes about 1 in 10 (6°), and so does a tin shed on a terrace. The
 * wall is the 9-inch brick wall. The clear path is a working value: no rule is cited for it until
 * the gazetted text is checked. Floors are counted from the ground, a storey each.
 */
export const IN_ROOF_FACTS: RoofMarketFacts = {
  ...ROOF_FACTS_DEFAULT,
  wallThicknessM: 0.23,
  materialOrder: ['rcc', 'trapezoidal_sheet', 'ac_sheet', 'clay_tile', 'puf_panel'],
  firstSlopeDeg: {
    trapezoidal_sheet: 6,
    corrugated_gi: 6,
    standing_seam: 6,
    puf_panel: 6,
  },
};
