/**
 * `F1-53` — the market's utility directory: the regions a site record selects from and the
 * network operators serving each, plus how long that operator's own processes typically take.
 *
 * **Operator and region names are never translated** (`F3-08`), so they are plain strings rather
 * than `PackLabel`s: a DISCOM's name is its name in every language, and three copies of it would
 * be three chances to mistype one.
 *
 * A region with no declared operator carries an EMPTY list, not an invented entry. The
 * generic "{region} utility" a picker shows in that case is the SCREEN's (`MS1-03`, `MS1-04`) —
 * a composed sentence with a slot belongs to the translator, not to pack data.
 *
 * Tariffs are NOT here. `MS1-03` calls the representative tariff table pack data, and `F1` has no
 * row for it; that gap belongs to the studio's own task rather than to an invented key here.
 */

export interface UtilityRegion {
  readonly region: string;
  /**
   * The administrative area this region lies in, by its code (`areas.ts`, `IN-MH`). The directory's
   * own names are the operators' (`Delhi`, `Daman & Diu`) and do not match an area's, so the code
   * is the join — and two regions may share one area. `null` on a pack stored before the code was
   * declared: it then serves no area until the next revision.
   */
  readonly area: string | null;
  readonly operators: readonly string[];
}

/**
 * How long one of the operator's processes usually takes (`F1-53`). This is what makes a wait
 * ATTRIBUTABLE rather than mysterious: the customer link renders "applied {date}, typically
 * {range}" against it, so a stalled project reads as the DISCOM's queue and not as the EPC's
 * silence. The range is data because it is honest to revise it; the sentence is copy.
 */
export interface UtilityWait {
  readonly procedure: string;
  readonly typicalWeeks: { readonly from: number; readonly to: number };
}

export interface UtilityDirectory {
  readonly regions: readonly UtilityRegion[];
  readonly waits: readonly UtilityWait[];
}

/** The operators serving a region — empty where the market declares none (`F1-09`). */
export function operatorsForRegion(directory: UtilityDirectory, region: string): readonly string[] {
  return directory.regions.find((declared) => declared.region === region)?.operators ?? [];
}

/**
 * The operators serving an administrative area, in the directory's order — every region that lies
 * in it, each operator once. Empty where the market declares none (`F1-09`).
 */
export function operatorsForArea(directory: UtilityDirectory, area: string): readonly string[] {
  const operators = directory.regions
    .filter((declared) => declared.area === area)
    .flatMap((declared) => declared.operators);
  return [...new Set(operators)];
}

/** The typical wait for one operator procedure, or `null` where the market declares none. */
export function typicalWait(directory: UtilityDirectory, procedure: string): UtilityWait | null {
  return directory.waits.find((declared) => declared.procedure === procedure) ?? null;
}

/**
 * India — the 37 states and union territories, and the DISCOMs serving them (`F1-53`, `MS1-03`;
 * content from the studio inventory at `Solar-App-POC`). Alphabetical, because a picker renders
 * this order and a shuffled list reads as a different control.
 *
 * Fourteen regions carry no operator. That is the source's own state, not an omission to fill in
 * from memory: naming a DISCOM we have not verified would put an invented operator on a site
 * record and, downstream, on a customer's net-metering paperwork.
 */
export const IN_UTILITIES: UtilityDirectory = {
  regions: [
    { region: 'Andaman & Nicobar', area: 'IN-AN', operators: [] },
    { region: 'Andhra Pradesh', area: 'IN-AP', operators: ['APSPDCL', 'APEPDCL', 'APCPDCL'] },
    { region: 'Arunachal Pradesh', area: 'IN-AR', operators: [] },
    { region: 'Assam', area: 'IN-AS', operators: ['APDCL'] },
    { region: 'Bihar', area: 'IN-BR', operators: ['NBPDCL', 'SBPDCL'] },
    { region: 'Chandigarh', area: 'IN-CH', operators: ['CPDL'] },
    { region: 'Chhattisgarh', area: 'IN-CG', operators: ['CSPDCL'] },
    { region: 'Dadra & Nagar Haveli', area: 'IN-DH', operators: [] },
    { region: 'Daman & Diu', area: 'IN-DH', operators: [] },
    {
      region: 'Delhi',
      area: 'IN-DL',
      operators: ['BSES Rajdhani', 'BSES Yamuna', 'Tata Power DDL'],
    },
    { region: 'Goa', area: 'IN-GA', operators: ['Goa Electricity Dept'] },
    {
      region: 'Gujarat',
      area: 'IN-GJ',
      operators: ['UGVCL', 'MGVCL', 'DGVCL', 'PGVCL', 'Torrent Power'],
    },
    { region: 'Haryana', area: 'IN-HR', operators: ['UHBVN', 'DHBVN'] },
    { region: 'Himachal Pradesh', area: 'IN-HP', operators: ['HPSEB'] },
    { region: 'Jammu & Kashmir', area: 'IN-JK', operators: [] },
    { region: 'Jharkhand', area: 'IN-JH', operators: ['JBVNL'] },
    {
      region: 'Karnataka',
      area: 'IN-KA',
      operators: ['BESCOM', 'MESCOM', 'HESCOM', 'GESCOM', 'CESC Mysore'],
    },
    { region: 'Kerala', area: 'IN-KL', operators: ['KSEB'] },
    { region: 'Ladakh', area: 'IN-LA', operators: [] },
    { region: 'Lakshadweep', area: 'IN-LD', operators: [] },
    {
      region: 'Madhya Pradesh',
      area: 'IN-MP',
      operators: ['MPPKVVCL East', 'MPPKVVCL Central', 'MPPKVVCL West'],
    },
    {
      region: 'Maharashtra',
      area: 'IN-MH',
      operators: ['MSEDCL', 'Tata Power Mumbai', 'Adani Electricity Mumbai', 'BEST'],
    },
    { region: 'Manipur', area: 'IN-MN', operators: [] },
    { region: 'Meghalaya', area: 'IN-ML', operators: [] },
    { region: 'Mizoram', area: 'IN-MZ', operators: [] },
    { region: 'Nagaland', area: 'IN-NL', operators: [] },
    { region: 'Odisha', area: 'IN-OD', operators: ['TPCODL', 'TPWODL', 'TPNODL', 'TPSODL'] },
    { region: 'Puducherry', area: 'IN-PY', operators: [] },
    { region: 'Punjab', area: 'IN-PB', operators: ['PSPCL'] },
    { region: 'Rajasthan', area: 'IN-RJ', operators: ['JVVNL', 'AVVNL', 'JdVVNL'] },
    { region: 'Sikkim', area: 'IN-SK', operators: [] },
    { region: 'Tamil Nadu', area: 'IN-TN', operators: ['TANGEDCO'] },
    { region: 'Telangana', area: 'IN-TS', operators: ['TSSPDCL', 'TSNPDCL'] },
    { region: 'Tripura', area: 'IN-TR', operators: [] },
    {
      region: 'Uttar Pradesh',
      area: 'IN-UP',
      operators: ['PUVVNL', 'MVVNL', 'DVVNL', 'PVVNL', 'KESCO', 'NPCL'],
    },
    { region: 'Uttarakhand', area: 'IN-UK', operators: ['UPCL'] },
    { region: 'West Bengal', area: 'IN-WB', operators: ['WBSEDCL', 'CESC Kolkata'] },
  ],
  /**
   * `F1-53` names one process and one range — net-metering approval, three to six weeks — and no
   * other. The rest are unauthored rather than estimated: a wait a customer reads is a promise,
   * and an invented one turns an honest attribution into a wrong number.
   */
  waits: [{ procedure: 'net_metering_approval', typicalWeeks: { from: 3, to: 6 } }],
};
