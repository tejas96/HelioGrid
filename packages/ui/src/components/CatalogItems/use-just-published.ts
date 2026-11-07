import { useEffect, useRef, useState } from 'react';

/**
 * True once the tag in force changes while the hero is on screen — a release just published —
 * so the hero plays its moment once. A tag the hero opened on never counts.
 */
export function useJustPublished(tag: string | null): boolean {
  const first = useRef(tag);
  const [published, setPublished] = useState(false);
  useEffect(() => {
    if (tag !== null && tag !== first.current) setPublished(true);
  }, [tag]);
  return published;
}
