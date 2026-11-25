'use client';
import { useState } from 'react';

/**
 * The canvas's foot as a node (a platform adapter): on a phone the View and picture panels open
 * there, where the thumb is, in the tools' and the bar's place. `node` is `null` on a wide screen,
 * where they open beside their buttons.
 */
export function useFootSlot(phone: boolean): {
  readonly ref: (node: HTMLDivElement | null) => void;
  readonly node: HTMLDivElement | null;
} {
  // biome-ignore lint/plugin: the web's own node for a portal; the phone shows this page
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  return { ref: setNode, node: phone ? node : null };
}
