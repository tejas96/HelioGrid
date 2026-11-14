/** A block's words as the checklist hands them to a step (`T-M06-022`). */
export const MARK = { title: 'Add the price', line: 'The price is what the customer pays.' };

/** Why a *Save as company default* did not land, as the step's view hands it over. */
export const DEFAULT_FAILED = 'You are offline. Try again when you are back.';

/** A refusal's reason as a spec reads it back at its field: the field's own name tells cases apart. */
export const refusalOf = (field: string) => `Refused: ${field}`;
