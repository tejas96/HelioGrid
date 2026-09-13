/**
 * Which actor class a party is drawn as. Declared once because both halves look the descriptor
 * and the glyph up through it, and a party added to one map only would draw an unstyled turn.
 */
export const PARTY_CLASS = { agent: 'agent', customer: 'customer' } as const;
