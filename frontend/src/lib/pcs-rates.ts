// Official PCS allowance figures, kept in one place. Sources: DoD Per Diem Committee CY2026 DLA memo
// (UTD/MAP 72-25(I)), DTMO POV mileage memo (CAP 46-26(I), 1 Jul 2026), GSA FTR Bulletin 26-01, DFAS TLE page.
// Every number here is an estimate input; the finance office pays per the JTR.

export const RATES_YEAR = 2026;

/** Primary DLA, effective 1 Jan 2026: [without dependents, with dependents]. */
export const DLA: Record<string, [number, number]> = {
  "O-10": [5187.33, 6385.58], "O-9": [5187.33, 6385.58], "O-8": [5187.33, 6385.58], "O-7": [5187.33, 6385.58],
  "O-6": [4758.96, 5749.63], "O-5": [4583.51, 5542.06], "O-4": [4247.61, 4885.43], "O-3": [3404.11, 4041.88],
  "O-2": [2700.31, 3451.28], "O-1": [2273.82, 3085.23],
  "O-3E": [3675.83, 4343.8], "O-2E": [3124.87, 3919.27], "O-1E": [2687.09, 3621.1],
  "W-5": [4315.51, 4715.58], "W-4": [3832.45, 4323.11], "W-3": [3221.08, 3960.78], "W-2": [2860.7, 3643.75], "W-1": [2394.55, 3151.31],
  "E-9": [3147.54, 4149.51], "E-8": [2888.97, 3824.94], "E-7": [2468.19, 3551.31], "E-6": [2389.42, 3548.02],
  "E-5": [2389.42, 3548.02], "E-4": [2389.42, 3548.02], "E-3": [2355.48, 3548.02], "E-2": [2025.26, 3548.02], "E-1": [1870.58, 3548.02],
};
export const GRADES = Object.keys(DLA);

/** MALT per mile per authorized vehicle (max 2 with dependents). $0.205 Jan–Jun 2026, $0.235 from 1 Jul 2026. */
export const MALT_PER_MILE = 0.235;
/** Standard CONUS per diem (FY2026): lodging $110 + M&IE $68. PCS travel days pay the flat rate. */
export const CONUS_PER_DIEM = 178;
export const CONUS_MIE = 68;
export const CONUS_LODGING = 110;
/** TLE: capped per day, up to 21 days CONUS-to-CONUS (7 days when the new station is OCONUS). */
export const TLE_DAILY_CAP = 290;
export const TLE_MAX_DAYS_CONUS = 21;
export const TLE_MAX_DAYS_OCONUS = 7;

/** JTR: one travel day per 350 miles of official distance; a leftover of 51+ miles adds a day. */
export function travelDays(miles: number): number {
  if (miles <= 0) return 0;
  const full = Math.floor(miles / 350);
  return Math.max(1, full + (miles - full * 350 >= 51 ? 1 : 0));
}

/** TLE percentage of the locality lodging + M&IE rate for the people in temporary quarters. */
export function tlePercent(hasDependents: boolean, dependents12Plus: number, dependentsUnder12: number): number {
  if (!hasDependents) return 0.65;
  const total = dependents12Plus + dependentsUnder12;
  if (total === 0) return 0.65;
  // member + 1 dependent = 100%; each further dependent adds 35% (12+) or 25% (under 12)
  let pct = 1;
  const extraOlder = Math.max(0, dependents12Plus - 1);
  const extraYounger = dependents12Plus >= 1 ? dependentsUnder12 : Math.max(0, dependentsUnder12 - 1);
  pct += extraOlder * 0.35 + extraYounger * 0.25;
  return pct;
}

export interface MoveInputs {
  grade: string;
  hasDependents: boolean;
  dependents12Plus: number;
  dependentsUnder12: number;
  miles: number;
  vehicles: 1 | 2;
  tleDays: number;
  oconus: boolean;
}

export function estimate(i: MoveInputs) {
  const dla = DLA[i.grade]?.[i.hasDependents ? 1 : 0] ?? 0;
  const days = travelDays(i.miles);
  const vehicles = i.hasDependents ? i.vehicles : 1;
  const malt = i.miles * MALT_PER_MILE * vehicles;
  const dependentDaily = i.hasDependents ? i.dependents12Plus * 0.75 * CONUS_PER_DIEM + i.dependentsUnder12 * 0.5 * CONUS_PER_DIEM : 0;
  const perDiem = days * (CONUS_PER_DIEM + dependentDaily);
  const maxDays = i.oconus ? TLE_MAX_DAYS_OCONUS : TLE_MAX_DAYS_CONUS;
  const tleDays = Math.min(Math.max(0, i.tleDays), maxDays);
  const tleDaily = Math.min(TLE_DAILY_CAP, (CONUS_LODGING + CONUS_MIE) * tlePercent(i.hasDependents, i.dependents12Plus, i.dependentsUnder12));
  const tle = tleDays * tleDaily;
  return { dla, days, malt, perDiem, tle, tleDaily, tleDays, maxDays, total: dla + malt + perDiem + tle };
}
