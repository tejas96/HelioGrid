import { useEffect } from 'react';

/**
 * **Who took the photograph.** THE PHOTO CREDIT IS `credit`, NOT `attribution`: `attribution` is a
 * system-wide slot — which layer supplied an un-overridden value, rendered by ValueSource — and
 * this prop held a photographer's name under the same word. The old name still works and warns.
 */
export function usePhotoCredit(
  credit: string | undefined,
  attribution: string | undefined,
): string | undefined {
  useEffect(() => {
    if (attribution !== undefined) {
      console.warn(
        'Image: `attribution` is now `credit` (who took the photograph). `attribution` is the system’s ValueSource slot — which layer supplied a value — and an image frame does not have one.',
      );
    }
  }, [attribution]);
  return credit ?? attribution;
}
