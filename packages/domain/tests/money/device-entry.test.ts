import { describe, expect, it } from 'vitest';
import * as deviceEntry from '../../src/index';
import type { MinorUnits } from '../../src/money/minor-units';
import * as serverEntry from '../../src/server';

/* `F4-04`: no device computes a money figure. The index is what every device bundles, so anything on
   it that hands out a function returning a figure — the export itself, a member of an exported
   object, or a function another function returns — is one a screen can call and print. The type
   half reads RETURN TYPES and fails closed past its depth: it cannot see a function that computes a
   figure inside and returns something else, which is why the runtime half below compares every
   function reachable from the index with the server entry's by identity. */

type Deeper<Depth extends unknown[]> = [...Depth, 0];
type TooDeep<Depth extends unknown[]> = Depth['length'] extends 8 ? true : false;
/**
 * The platform's own objects, and primitives — a branded code included — carry no figure of ours;
 * walking their methods only exhausts the depth.
 */
type Platform =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | RegExp
  | Date
  | Promise<unknown>
  | ReadonlyMap<unknown, unknown>
  | ReadonlySet<unknown>;

/** Does a value of this type carry a money figure? Past the depth limit it is assumed to. */
type HoldsMoney<T, Depth extends unknown[] = []> =
  TooDeep<Depth> extends true
    ? true
    : T extends MinorUnits
      ? true
      : T extends Platform
        ? false
        : T extends (...args: never[]) => unknown
          ? false
          : T extends readonly (infer Item)[]
            ? HoldsMoney<Item, Deeper<Depth>>
            : T extends object
              ? true extends { [K in keyof T]-?: HoldsMoney<T[K], Deeper<Depth>> }[keyof T]
                ? true
                : false
              : false;

/** Does a value of this type hand out a function that returns a money figure, at any depth? */
type ComputesMoney<T, Depth extends unknown[] = []> =
  TooDeep<Depth> extends true
    ? true
    : T extends Platform
      ? false
      : T extends (...args: never[]) => infer Result
        ? true extends HoldsMoney<Result>
          ? true
          : ComputesMoney<Result, Deeper<Depth>>
        : T extends readonly (infer Item)[]
          ? ComputesMoney<Item, Deeper<Depth>>
          : T extends object
            ? true extends { [K in keyof T]-?: ComputesMoney<T[K], Deeper<Depth>> }[keyof T]
              ? true
              : false
            : false;

type DeviceEntry = typeof deviceEntry;

type ReturnsMoney = {
  [Name in keyof DeviceEntry]: true extends ComputesMoney<DeviceEntry[Name]> ? Name : never;
}[keyof DeviceEntry];

/** Every function reachable from a value by its own properties, cycles walked once. */
function functionsWithin(value: unknown, seen = new Set<unknown>()): Set<unknown> {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function') ||
    seen.has(value)
  ) {
    return seen;
  }
  seen.add(value);
  for (const member of Object.values(value)) functionsWithin(member, seen);
  return seen;
}

/** Returns a figure and computes none. Each name says why; a name without a reason is not reviewed. */
type ReviewedComputesNothing =
  /* mints the brand over a value the wire or a pack already holds */
  | 'minorUnits'
  /* read a figure out of a pack as written */
  | 'tierRow'
  | 'listedPrice'
  | 'mandateType'
  | 'activeStatutoryExtras'
  /* return a whole pack as written */
  | 'marketOfPhone'
  | 'phoneReach'
  | 'parseStoredPack'
  | 'readStoredPack'
  /* the schemas those two parse with: a pack out, as written */
  | 'PACK_SCHEMAS'
  /* picks the setting in force per key; its shape outruns the depth the check walks, and it holds no figure */
  | 'resolveEffectiveSettings'
  /* label a figure they are handed (`F8`) */
  | 'qualifyMoney'
  | 'qualifyMinorUnits'
  | 'compactQualified'
  | 'statedAssumptions';

/** `true` only when the set is empty; otherwise the type NAMES what is in it, so the error does. */
type NoneOf<Names> = [Names] extends [never] ? true : { unreviewed: Names };

describe('the device entry — what every screen bundles', () => {
  it('exports no function that returns a money figure it computed', () => {
    const noneUnreviewed: NoneOf<Exclude<ReturnsMoney, ReviewedComputesNothing>> = true;
    expect(noneUnreviewed).toBe(true);
  });

  it('reaches no function of the server entry, under any name or inside any export', () => {
    const reachable = functionsWithin(deviceEntry);
    const onBoth = Object.entries(serverEntry).filter(([, computation]) =>
      reachable.has(computation),
    );
    expect(onBoth.map(([name]) => name)).toEqual([]);
  });
});
