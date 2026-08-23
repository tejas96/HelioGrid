import { IN_FORMAT } from '../../utils/format';

/**
 * The India pack's money shortcut, for a call site that genuinely means rupees and is **not**
 * inside a component (a static label, a fixture).
 *
 * It is not the route to formatted money in a chart: passing `format={inr}` pins that chart to
 * one market, which is exactly what the pack exists to prevent. Inside a chart, read
 * `useFormat()` — every plot already does. It owns no arithmetic of its own; `IN_FORMAT` is the
 * shipped default built by `utils/format`.
 */
export function inr(n: number): string {
  return IN_FORMAT.money(n);
}
