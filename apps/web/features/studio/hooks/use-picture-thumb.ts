'use client';
import { useCallback, useEffect, useState } from 'react';

/**
 * A picture held in the browser's memory as an address an image can show: made when the picture
 * comes, and given back when a newer one replaces it or the screen leaves. `null` until one comes.
 */
export function usePictureThumb(): readonly [string | null, (picture: Blob) => void] {
  // biome-ignore lint/plugin: the browser's own address for a picture in its memory is the platform's fact, not screen state
  const [address, setAddress] = useState<string | null>(null);
  const show = useCallback((picture: Blob) => setAddress(URL.createObjectURL(picture)), []);
  useEffect(() => {
    if (address === null) return;
    return () => URL.revokeObjectURL(address);
  }, [address]);
  return [address, show] as const;
}
