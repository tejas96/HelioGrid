/**
 * Screen-level barrel (ADR-0022). The gallery is `'use client'` while `DesignScreen` is a
 * Server Component, and Next attaches a client chunk to EVERY page importing the barrel that
 * reaches it — so exporting both from one feature barrel put the whole gallery in /design's
 * bundle (147 kB vs 102 kB) and no tree-shaking could remove it. A barrel must not mix server
 * and client screens.
 */
export { GalleryScreen } from './GalleryScreen';
