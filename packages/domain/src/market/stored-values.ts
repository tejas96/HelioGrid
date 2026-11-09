import { z } from 'zod';
import { clockTimeOfMinutes } from '../calling/clock-time';
import { UI_LANGUAGES, type UiLanguage } from '../format/languages';
import { basisPoints } from '../money/basis-points';
import { minorUnits } from '../money/minor-units';
import { marketCode } from './code';

/**
 * The stored forms a pack key is built from, each re-minted through its OWNER's constructor, so
 * the parser never writes `as <Brand>`. A constructor that refuses a value reports through
 * zod with its own words, so a failure reads exactly as the owner would have thrown it.
 */
export function minted<In, Out>(
  stored: z.ZodType<In, z.ZodTypeDef, unknown>,
  construct: (value: In) => Out,
): z.ZodType<Out, z.ZodTypeDef, unknown> {
  return stored.transform((value, context) => {
    try {
      return construct(value);
    } catch (error) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: String(error),
      });
      return z.NEVER;
    }
  });
}

/** An amount a pack declares — a price, a cap, a threshold, a subsidy. Never a credit. */
export const packAmount = minted(z.number().nonnegative(), minorUnits);
export const packRate = minted(z.number(), basisPoints);
export const packClockTime = minted(z.number(), clockTimeOfMinutes);
export const packMarketCode = minted(z.string(), marketCode);

/** A quantity a pack measures that may be fractional — a width in kWp. */
export const packCount = z.number().nonnegative();
/** A number a pack counts in whole units — digits, a length, parts, hours, days, months, years. */
export const packWhole = z.number().int().nonnegative();

/** One of a closed set of numbers, as the type spells them — a month, a weekday. */
export function oneOf<const T extends readonly number[]>(values: T) {
  return z.custom<T[number]>((value) => values.some((allowed) => allowed === value), {
    message: `one of ${values.join(', ')}`,
  });
}

/**
 * A value per language, English required (`F3-05`), no language outside the set — built from the
 * set itself, so a new language is accepted here without an edit.
 */
export function perLanguage<T>(value: z.ZodType<T, z.ZodTypeDef, unknown>) {
  const optional = Object.fromEntries(
    UI_LANGUAGES.map((language) => [language, value.optional()]),
  ) as Record<UiLanguage, z.ZodOptional<typeof value>>;
  return z.object({ ...optional, en: value });
}
export const packLabel = perLanguage(z.string());
