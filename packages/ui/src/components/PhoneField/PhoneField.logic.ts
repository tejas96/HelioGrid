/**
 * Everything that is not a digit. Both halves strip a dial code and a typed number with it, so
 * it is declared once: two copies of a pattern are two places a character class can widen.
 */
export const NON_DIGIT = /\D/g;
