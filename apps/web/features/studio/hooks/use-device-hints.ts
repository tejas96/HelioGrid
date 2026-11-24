import type { DeviceHints } from '@heliogrid/domain';

/** The browser's word on its device, where it gives one; `deviceMemory` is Chromium's alone. */
type NavigatorHints = Navigator & { readonly deviceMemory?: number };

/**
 * What this device says of itself (`T-M05-002`, G034; the platform adapter): its processor cores
 * and its memory in gigabytes, each `null` where the browser keeps it to itself.
 */
export function deviceHintsNow(): DeviceHints {
  if (typeof navigator === 'undefined') return { cores: null, memoryGb: null };
  const hints: NavigatorHints = navigator;
  const cores = hints.hardwareConcurrency;
  const memory = hints.deviceMemory;
  return {
    cores: typeof cores === 'number' && cores > 0 ? cores : null,
    memoryGb: typeof memory === 'number' && memory > 0 ? memory : null,
  };
}
