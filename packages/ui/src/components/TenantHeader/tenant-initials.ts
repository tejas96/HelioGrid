/**
 * The monogram source: up to two initials from the tenant's name. Falls back to a bullet so a
 * lockup with an unusable name still draws a mark rather than an empty tile.
 */
export function tenantInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.slice(0, 1))
    .join('')
    .toUpperCase();
  return letters === '' ? '•' : letters;
}

/** A logo prop that is a URL string rather than a ready node. */
export function isLogoUrl(logo: unknown): logo is string {
  return typeof logo === 'string' && logo.length > 0;
}
