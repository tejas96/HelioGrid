import { z } from 'zod';
import { geoPointSchema, uuidSchema } from '../common';

/**
 * Finding a place for a site: suggestions as an address is typed, the place a suggestion names,
 * and the place at a typed point. The api asks the map service; an app never holds its key.
 *
 * Every answer says whether the service answered. A search that is down is a state the screen
 * draws — typed coordinates still set the place — never an error page.
 */

/** One search, from the first letter to the picked suggestion — the map service bills it as one. */
const placeSessionSchema = uuidSchema;

export const placeSuggestionsQuerySchema = z.object({
  query: z.string().trim().min(3).max(200),
  session: placeSessionSchema,
});

export const placeSuggestionSchema = z.object({
  placeId: z.string(),
  /** The first line — the street or the locality. */
  title: z.string(),
  /** The second line — the city, the state, the postal code. */
  line: z.string(),
});
export type PlaceSuggestion = z.infer<typeof placeSuggestionSchema>;

export const placeSuggestionsSchema = z.object({
  available: z.boolean(),
  suggestions: z.array(placeSuggestionSchema),
});
export type PlaceSuggestions = z.infer<typeof placeSuggestionsSchema>;

export const placeDetailsQuerySchema = z.object({
  placeId: z.string().min(1).max(400),
  session: placeSessionSchema,
});

export const placeAtQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const placeSchema = z.object({
  address: z.string().nullable(),
  pin: geoPointSchema,
  /** The market pack's region code the place lies in, or `null` when its region matched none. */
  area: z.string().nullable(),
  /** `false`: the place is outside the company's market. `null`: the service did not say. */
  inMarket: z.boolean().nullable(),
});
export type Place = z.infer<typeof placeSchema>;

/** `place` is `null` when the service did not answer, or knows no such place. */
export const placeAnswerSchema = z.object({
  available: z.boolean(),
  place: placeSchema.nullable(),
});
export type PlaceAnswer = z.infer<typeof placeAnswerSchema>;
