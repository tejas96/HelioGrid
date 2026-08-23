/**
 * The initials circle's letters: the first letter of each of the first two words, upper-cased.
 * One declaration, so a record reads the same on the phone card as it does anywhere else.
 */
export function recordInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}
