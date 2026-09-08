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
    { region: 'Andaman & Nicobar', operators: [] },
    { region: 'Andhra Pradesh', operators: ['APSPDCL', 'APEPDCL', 'APCPDCL'] },
    { region: 'Arunachal Pradesh', operators: [] },
    { region: 'Assam', operators: ['APDCL'] },
    { region: 'Bihar', operators: ['NBPDCL', 'SBPDCL'] },
    { region: 'Chandigarh', operators: ['CPDL'] },
    { region: 'Chhattisgarh', operators: ['CSPDCL'] },
    { region: 'Dadra & Nagar Haveli', operators: [] },
    { region: 'Daman & Diu', operators: [] },
    { region: 'Delhi', operators: ['BSES Rajdhani', 'BSES Yamuna', 'Tata Power DDL'] },
    { region: 'Goa', operators: ['Goa Electricity Dept'] },
    { region: 'Gujarat', operators: ['UGVCL', 'MGVCL', 'DGVCL', 'PGVCL', 'Torrent Power'] },
    { region: 'Haryana', operators: ['UHBVN', 'DHBVN'] },
    { region: 'Himachal Pradesh', operators: ['HPSEB'] },
    { region: 'Jammu & Kashmir', operators: [] },
    { region: 'Jharkhand', operators: ['JBVNL'] },
    { region: 'Karnataka', operators: ['BESCOM', 'MESCOM', 'HESCOM', 'GESCOM', 'CESC Mysore'] },
    { region: 'Kerala', operators: ['KSEB'] },
    { region: 'Ladakh', operators: [] },
    { region: 'Lakshadweep', operators: [] },
    {
      region: 'Madhya Pradesh',
      operators: ['MPPKVVCL East', 'MPPKVVCL Central', 'MPPKVVCL West'],
    },
    {
      region: 'Maharashtra',
      operators: ['MSEDCL', 'Tata Power Mumbai', 'Adani Electricity Mumbai', 'BEST'],
    },
    { region: 'Manipur', operators: [] },
    { region: 'Meghalaya', operators: [] },
    { region: 'Mizoram', operators: [] },
    { region: 'Nagaland', operators: [] },
    { region: 'Odisha', operators: ['TPCODL', 'TPWODL', 'TPNODL', 'TPSODL'] },
    { region: 'Puducherry', operators: [] },
    { region: 'Punjab', operators: ['PSPCL'] },
    { region: 'Rajasthan', operators: ['JVVNL', 'AVVNL', 'JdVVNL'] },
    { region: 'Sikkim', operators: [] },
    { region: 'Tamil Nadu', operators: ['TANGEDCO'] },
    { region: 'Telangana', operators: ['TSSPDCL', 'TSNPDCL'] },
    { region: 'Tripura', operators: [] },
    {
      region: 'Uttar Pradesh',
      operators: ['PUVVNL', 'MVVNL', 'DVVNL', 'PVVNL', 'KESCO', 'NPCL'],
    },
    { region: 'Uttarakhand', operators: ['UPCL'] },
    { region: 'West Bengal', operators: ['WBSEDCL', 'CESC Kolkata'] },
  ],
  /**
   * `F1-53` names one process and one range — net-metering approval, three to six weeks — and no
   * other. The rest are unauthored rather than estimated: a wait a customer reads is a promise,
   * and an invented one turns an honest attribution into a wrong number.
   */
  waits: [{ procedure: 'net_metering_approval', typicalWeeks: { from: 3, to: 6 } }],
};
